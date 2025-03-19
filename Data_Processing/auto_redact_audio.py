#!/usr/bin/env python3
import os
import re
from docx import Document
from pydub import AudioSegment

# Set your input and output directories here:
input_path = r'C:\Users\julia\Downloads\research\muhsic\wav_original'
output_path = r'C:\Users\julia\Downloads\research\muhsic\wav_redacted'

def parse_timestamp(ts_str):
    """
    Parse a timestamp in the format HH:MM:SS.mm and return total seconds.
    The fractional part (.mm) is assumed to be hundredths of a second.
    """
    hours, minutes, sec_fraction = ts_str.split(":")
    seconds, fraction = sec_fraction.split(".")
    total_seconds = int(hours) * 3600 + int(minutes) * 60 + int(seconds) + int(fraction) / 100.0
    return total_seconds

def merge_intervals(intervals):
    """
    Merge overlapping or adjacent intervals.
    Each interval is a tuple (start_ms, end_ms).
    """
    merged = []
    for start, end in sorted(intervals):
        if not merged or start > merged[-1][1]:
            merged.append([start, end])
        else:
            merged[-1][1] = max(merged[-1][1], end)
    return merged

def process_docx_for_redaction(docx_path):
    """
    Open the DOCX file and look for redaction markers and timestamps.
    Returns a list of (start_ms, end_ms) intervals indicating the sections
    of audio that should be silenced.
    """
    doc = Document(docx_path)
    # Combine all paragraphs into one text string.
    full_text = "\n".join(para.text for para in doc.paragraphs)

    # Regex for timestamps in square brackets, e.g. [00:01:30.50]
    timestamp_pattern = re.compile(r'\[(\d{2}:\d{2}:\d{2}\.\d{2})\]')
    # Regex for redaction markers: "s/" or "/s" or "s\\" or "\\s"
    marker_pattern = re.compile(r'(s[\/\\]|[\/\\]s)')

    # Find all timestamps (store their position and value)
    timestamps = [(m.start(), m.group(1)) for m in timestamp_pattern.finditer(full_text)]
    # Find all redaction markers (store start and end indices)
    markers = [(m.start(), m.end()) for m in marker_pattern.finditer(full_text)]

    intervals = []
    for marker_start, marker_end in markers:
        # Find nearest timestamp to the left of the marker
        left_candidates = [(pos, ts) for pos, ts in timestamps if pos < marker_start]
        if not left_candidates:
            continue  # Skip if no left timestamp found
        left_pos, left_ts = max(left_candidates, key=lambda x: x[0])

        # Find nearest timestamp to the right of the marker
        right_candidates = [(pos, ts) for pos, ts in timestamps if pos > marker_end]
        if not right_candidates:
            continue  # Skip if no right timestamp found
        right_pos, right_ts = min(right_candidates, key=lambda x: x[0])

        # Convert timestamps to milliseconds
        left_time_ms = int(parse_timestamp(left_ts) * 1000)
        right_time_ms = int(parse_timestamp(right_ts) * 1000)

        if right_time_ms > left_time_ms:
            intervals.append((left_time_ms, right_time_ms))

    # Merge any overlapping intervals
    merged_intervals = merge_intervals(intervals)
    return merged_intervals

def process_audio(wav_path, intervals, output_path):
    """
    Load the WAV file and replace the audio between each interval with silence.
    The result is saved to the output path.
    """
    audio = AudioSegment.from_wav(wav_path)
    # If there are no redaction intervals, simply copy the file.
    if not intervals:
        audio.export(output_path, format="wav")
        return

    # Build the new audio segment by preserving parts not redacted.
    new_audio = AudioSegment.empty()
    previous_end = 0
    for start, end in intervals:
        # Ensure the interval is within the audio length.
        start = max(previous_end, start)
        end = min(len(audio), end)
        # Append audio from the previous end to the start of the interval.
        new_audio += audio[previous_end:start]
        # Append silence for the duration of the interval.
        new_audio += AudioSegment.silent(duration=(end - start))
        previous_end = end
    # Append any remaining audio after the last interval.
    new_audio += audio[previous_end:]
    new_audio.export(output_path, format="wav")

def main(input_folder, output_folder):
    """
    Process each pair of DOCX and WAV files in the input folder.
    The updated WAV files with redacted (silenced) sections are saved in the output folder.
    """
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Loop through all DOCX files in the input folder.
    for filename in os.listdir(input_folder):
        if filename.lower().endswith('.docx'):
            basename = os.path.splitext(filename)[0]
            docx_path = os.path.join(input_folder, filename)
            wav_filename = basename + '.wav'
            wav_path = os.path.join(input_folder, wav_filename)
            if not os.path.exists(wav_path):
                print(f"WAV file for {basename} not found, skipping.")
                continue

            print(f"Processing {basename} ...")
            intervals = process_docx_for_redaction(docx_path)
            output_wav_path = os.path.join(output_folder, wav_filename)
            process_audio(wav_path, intervals, output_wav_path)
            print(f"Saved redacted audio to {output_wav_path}")

if __name__ == "__main__":
    main(input_path, output_path)
