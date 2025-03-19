#Vargo, Julian (2025) Automatic Audio Redactor [Computer Software]. Department of Spanish & Portuguese. University of California, Berkeley
#Written on Python 3.11.11
#Stores timestamps from word docs containing identifiable information, and redacts audio from wav files that lie between those timestamps.

#This script is file catchable - the input folder contains wav and docx files of the same basenames. Output folder is just wav files.
input_path = r'C:\Users\julia\Downloads\research\muhsic\wav_original'
output_path = r'C:\Users\julia\Downloads\research\muhsic\wav_redacted'

import os
import re
from docx import Document
from pydub import AudioSegment

def parse_timestamp(ts_str):
    hours, minutes, sec_fraction = ts_str.split(":")
    seconds, fraction = sec_fraction.split(".")
    total_seconds = int(hours) * 3600 + int(minutes) * 60 + int(seconds) + int(fraction) / 100.0
    return total_seconds

def merge_intervals(intervals):
    merged = []
    for start, end in sorted(intervals):
        if not merged or start > merged[-1][1]:
            merged.append([start, end])
        else:
            merged[-1][1] = max(merged[-1][1], end)
    return merged

def process_docx_for_redaction(docx_path):
    doc = Document(docx_path)
    full_text = "\n".join(para.text for para in doc.paragraphs)
    timestamp_pattern = re.compile(r'\[(\d{2}:\d{2}:\d{2}\.\d{2})\]')
    marker_pattern = re.compile(r'(s[\/\\]|[\/\\]s)')
    timestamps = [(m.start(), m.group(1)) for m in timestamp_pattern.finditer(full_text)]
    markers = [(m.start(), m.end()) for m in marker_pattern.finditer(full_text)]
    intervals = []
    for marker_start, marker_end in markers:
        left_candidates = [(pos, ts) for pos, ts in timestamps if pos < marker_start]
        if not left_candidates:
            continue
        left_pos, left_ts = max(left_candidates, key=lambda x: x[0])
        right_candidates = [(pos, ts) for pos, ts in timestamps if pos > marker_end]
        if not right_candidates:
            continue 
        right_pos, right_ts = min(right_candidates, key=lambda x: x[0])
        left_time_ms = int(parse_timestamp(left_ts) * 1000)
        right_time_ms = int(parse_timestamp(right_ts) * 1000)

        if right_time_ms > left_time_ms:
            intervals.append((left_time_ms, right_time_ms))
    merged_intervals = merge_intervals(intervals)
    return merged_intervals

def process_audio(wav_path, intervals, output_path):
    audio = AudioSegment.from_wav(wav_path)
    if not intervals:
        audio.export(output_path, format="wav")
        return
    new_audio = AudioSegment.empty()
    previous_end = 0
    for start, end in intervals:
        start = max(previous_end, start)
        end = min(len(audio), end)
        new_audio += audio[previous_end:start]
        new_audio += AudioSegment.silent(duration=(end - start))
        previous_end = end
    new_audio += audio[previous_end:]
    new_audio.export(output_path, format="wav")

def main(input_folder, output_folder):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
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

main(input_path, output_path)
