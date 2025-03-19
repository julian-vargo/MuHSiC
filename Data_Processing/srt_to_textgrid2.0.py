import os
import re
import codecs
import argparse
from pathlib import Path
from datetime import datetime, timedelta
import glob

folder = r"C:\Users\julia\Downloads\research\cook_dispersion\unaligned_textgrid\New folder"

def process_entirety(srt_file):
    def is_integer(line):
        return line.strip().isdigit()
    def normalize_speaker_number(srt_file):
        global temp_file
        temp_file = srt_file.replace(".srt", "_temp.srt")
        updated_lines = []
        with open(srt_file, 'r', encoding='utf-8') as file:
            lines = file.readlines()
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            updated_lines.append(lines[i])
            if is_integer(line):
                second_line = lines[i+1].strip()
                third_line = lines[i+2].strip()
                if third_line == "Speaker1:":
                    current_speaker = "Speaker1:"
                elif third_line == "Speaker2:":
                    current_speaker = "Speaker2:"
                else:
                    updated_lines.append(second_line+"\n")
                    updated_lines.append(current_speaker+"\n")
                    i += 2
                    continue
                updated_lines.append(second_line+"\n")
                updated_lines.append(third_line+"\n")
                i += 2
            i += 1
        with open(temp_file, 'w', encoding='utf-8') as file:
            file.writelines(updated_lines)
    def remove_quotes_from_srt_in_place(temp_file):
        with open(temp_file, "r", encoding="utf-8") as fin:
            lines = fin.readlines()
        cleaned_lines = []
        for line in lines:
            cleaned_line = line.replace("'", "").replace('"', "")
            cleaned_lines.append(cleaned_line)
        with open(temp_file, "w", encoding="utf-8") as fout:
            fout.writelines(cleaned_lines)
    def diarization(temp_file):
        global temp_file_s2
        temp_file_s2 = temp_file.replace("_temp.srt", "_s2.srt")
        s2_lines = []
        with open(temp_file, 'r', encoding='utf-8') as file:
            lines = file.readlines()
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if is_integer(line):
                first_line = lines[i].strip()
                second_line = lines[i+1].strip()
                third_line = lines[i+2].strip()
                fourth_line = lines[i+3].strip() if i+3 < len(lines) else ""
                if third_line == "Speaker2:":
                    s2_lines.append(first_line+"\n")
                    s2_lines.append(second_line+"\n")
                    s2_lines.append(third_line+"\n")
                    s2_lines.append(fourth_line+"\n")
                    s2_lines.append("\n")
                i += 3
            i += 1
        with open(temp_file_s2, 'w', encoding='utf-8') as file_s2:
            file_s2.writelines(s2_lines)
    def fix_integers(input_file):
        global renumbered
        renumbered = input_file.replace("_s2.srt", "_renumbered.srt")
        updated_lines = []
        with open(input_file, 'r', encoding='utf-8') as file:
            lines = file.readlines()
        new_index = 1
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if is_integer(line):
                updated_lines.append(f"{new_index}\n")
                new_index += 1
            else:
                updated_lines.append(lines[i])
            i += 1
        with open(renumbered, 'w', encoding='utf-8') as file:
            file.writelines(updated_lines)
    TIMECODE_REGEX = re.compile(r'(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})')
    TIME_FORMAT = "%H:%M:%S,%f"
    def parse_srt_time(timestr):
        dt = datetime.strptime(timestr, TIME_FORMAT)
        return timedelta(hours=dt.hour, minutes=dt.minute, seconds=dt.second, milliseconds=dt.microsecond//1000)
    def format_srt_time(td):
        total_seconds = int(td.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        milliseconds = int(td.microseconds/1000)
        return f"{hours:02}:{minutes:02}:{seconds:02},{milliseconds:03}"
    def parse_srt_file(path):
        subtitles = []
        with open(path, 'r', encoding='utf-8') as f:
            lines = [l.rstrip('\n') for l in f]
        i = 0
        while i < len(lines):
            if not lines[i].strip():
                i += 1
                continue
            index_line = lines[i].strip()
            try:
                index = int(index_line)
            except ValueError:
                i += 1
                continue
            i += 1
            time_match = TIMECODE_REGEX.match(lines[i])
            if not time_match:
                i += 1
                continue
            start_str, end_str = time_match.groups()
            start_td = parse_srt_time(start_str)
            end_td = parse_srt_time(end_str)
            i += 1
            text_lines = []
            while i < len(lines) and lines[i].strip():
                text_lines.append(lines[i])
                i += 1
            subtitles.append({'index': index, 'start': start_td, 'end': end_td, 'lines': text_lines})
        return subtitles
    def push_apart_overlap(input_file):
        subtitles = parse_srt_file(input_file)
        for i in range(len(subtitles)-1):
            current_sub = subtitles[i]
            next_sub = subtitles[i+1]
            if current_sub['end'] > next_sub['start']:
                avg_seconds = (current_sub['end'].total_seconds() + next_sub['start'].total_seconds())/2
                avg_time = timedelta(seconds=avg_seconds)
                current_sub['end'] = avg_time
                next_sub['start'] = avg_time
        with open(input_file, 'w', encoding='utf-8') as f:
            for sub in subtitles:
                f.write(f"{sub['index']}\n")
                start_str = format_srt_time(sub['start'])
                end_str = format_srt_time(sub['end'])
                f.write(f"{start_str} --> {end_str}\n")
                for line in sub['lines']:
                    f.write(line+"\n")
                f.write("\n")
    def generate_intermediate_subtitles(subtitles):
        new_subtitles = []
        for i in range(len(subtitles)-1):
            current_sub = subtitles[i]
            next_sub = subtitles[i+1]
            new_subtitles.append(current_sub)
            if current_sub['end'] != next_sub['start']:
                new_sub = {'index': None, 'start': current_sub['end'], 'end': next_sub['start'], 'lines': ['s/']}
                new_subtitles.append(new_sub)
        new_subtitles.append(subtitles[-1])
        return new_subtitles
    def reindex_subtitles(subtitles):
        sorted_subs = sorted(subtitles, key=lambda s: s['start'])
        for i, sub in enumerate(sorted_subs, start=1):
            sub['index'] = i
        return sorted_subs
    def write_srt_file(subtitles, path):
        with open(path, 'w', encoding='utf-8') as f:
            for sub in subtitles:
                f.write(str(sub['index'])+"\n")
                start_str = format_srt_time(sub['start'])
                end_str = format_srt_time(sub['end'])
                f.write(f"{start_str} --> {end_str}\n")
                for line in sub['lines']:
                    f.write(line+"\n")
                f.write("\n")
    def insert_empty_subtitles_if_gaps(input_srt):
        global silence_inserted
        silence_inserted = input_srt.replace("_renumbered.srt", "_silence_inserted.srt")
        subs = parse_srt_file(input_srt)
        subs_with_inserts = generate_intermediate_subtitles(subs)
        reindexed = reindex_subtitles(subs_with_inserts)
        write_srt_file(reindexed, silence_inserted)
    def insert_silence_if_not_zero(subtitles):
        if not subtitles:
            return subtitles
        first_sub = subtitles[0]
        if first_sub['start'] > timedelta(seconds=0):
            if first_sub['lines']:
                if first_sub['lines'][0].startswith("Speaker"):
                    speaker_line = first_sub['lines'][0]
                else:
                    speaker_line = first_sub['lines'][0]
            else:
                speaker_line = "Speaker1:"
            silence_sub = {'index': None, 'start': timedelta(seconds=0), 'end': first_sub['start'], 'lines': [speaker_line, "s/"]}
            subtitles.insert(0, silence_sub)
        sorted_subs = sorted(subtitles, key=lambda s: s['start'])
        for i, sub in enumerate(sorted_subs, start=1):
            sub['index'] = i
        return sorted_subs
    def initial_s(input_srt):
        global initial_silence
        initial_silence = input_srt.replace("_silence_inserted.srt", "_initial_silence.srt")
        subs = parse_srt_file(input_srt)
        subs_with_silence = insert_silence_if_not_zero(subs)
        write_srt_file(subs_with_silence, initial_silence)
    def srt_time_to_seconds(timestr):
        dt = datetime.strptime(timestr, TIME_FORMAT)
        td = timedelta(hours=dt.hour, minutes=dt.minute, seconds=dt.second, milliseconds=dt.microsecond//1000)
        return td.total_seconds()
    def parse_srt_file_for_textgrid(path):
        subtitles = []
        with open(path, 'r', encoding='utf-8') as f:
            lines = [l.rstrip('\n') for l in f]
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if not line:
                i += 1
                continue
            try:
                idx = int(line)
            except ValueError:
                i += 1
                continue
            i += 1
            time_match = TIMECODE_REGEX.match(lines[i]) if i < len(lines) else None
            if not time_match:
                i += 1
                continue
            start_str, end_str = time_match.groups()
            start_sec = srt_time_to_seconds(start_str)
            end_sec = srt_time_to_seconds(end_str)
            i += 1
            text_lines = []
            while i < len(lines) and lines[i].strip():
                text_lines.append(lines[i].strip())
                i += 1
            full_text = " ".join(text_lines)
            subtitles.append({'index': idx, 'start_sec': start_sec, 'end_sec': end_sec, 'text': full_text})
        return subtitles
    def write_textgrid(subtitles, output_path, tier_name="Interviewer"):
        if not subtitles:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write('File type = "ooTextFile"\n')
                f.write('Object class = "TextGrid"\n\n')
                f.write('xmin = 0\nxmax = 0\n')
                f.write('tiers? <exists>\nsize = 1\n')
                f.write('item []:\n\titem [1]:\n')
                f.write('\t\tclass = "IntervalTier"\n')
                f.write(f'\t\tname = "{tier_name}"\n')
                f.write('\t\txmin = 0\n')
                f.write('\t\txmax = 0\n')
                f.write('\t\tintervals: size = 0\n')
            return
        subtitles = sorted(subtitles, key=lambda s: s['index'])
        global_xmin = 0.0
        global_xmax = max(sub['end_sec'] for sub in subtitles)
        final_index = subtitles[-1]['index']
        interval_dict = {}
        for sub in subtitles:
            interval_dict[sub['index']] = {'xmin': sub['start_sec'], 'xmax': sub['end_sec'], 'text': sub['text']}
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('File type = "ooTextFile"\n')
            f.write('Object class = "TextGrid"\n\n')
            f.write(f'xmin = {global_xmin}\n')
            f.write(f'xmax = {global_xmax}\n')
            f.write('tiers? <exists>\n')
            f.write('size = 1\n')
            f.write('item []:\n')
            f.write('\titem [1]:\n')
            f.write('\t\tclass = "IntervalTier"\n')
            f.write(f'\t\tname = "{tier_name}"\n')
            f.write(f'\t\txmin = {global_xmin}\n')
            f.write(f'\t\txmax = {global_xmax}\n')
            f.write(f'\t\tintervals: size = {final_index}\n')
            for i in range(1, final_index+1):
                interval_xmin = 0.0
                interval_xmax = 0.0
                interval_text = ""
                if i in interval_dict:
                    interval_xmin = interval_dict[i]['xmin']
                    interval_xmax = interval_dict[i]['xmax']
                    interval_text = interval_dict[i]['text'].replace("Speaker2: ", "")
                f.write(f'\t\tintervals [{i}]:\n')
                f.write(f'\t\t\txmin = {interval_xmin}\n')
                f.write(f'\t\t\txmax = {interval_xmax}\n')
                f.write(f'\t\t\ttext = "{interval_text}"\n')
    def srt_to_textgrid(input_srt):
        subs = parse_srt_file_for_textgrid(input_srt)
        global output_textgrid
        output_textgrid = input_srt.replace("_initial_silence.srt", ".TextGrid")
        write_textgrid(subs, output_textgrid, tier_name="interviewee")
    normalize_speaker_number(srt_file)
    remove_quotes_from_srt_in_place(temp_file)
    diarization(temp_file)
    os.remove(temp_file)
    fix_integers(temp_file_s2)
    os.remove(temp_file_s2)
    push_apart_overlap(renumbered)
    insert_empty_subtitles_if_gaps(renumbered)
    os.remove(renumbered)
    initial_s(silence_inserted)
    os.remove(silence_inserted)
    TIMECODE_REGEX = re.compile(r'(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})')
    TIME_FORMAT = "%H:%M:%S,%f"
    srt_to_textgrid(initial_silence)
    os.remove(initial_silence)

def fix_overlapping_intervals(textgrid_path):
    with open(textgrid_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    interval_header_pattern = re.compile(r'^\s*intervals\s*\[\s*(\d+)\s*\]\s*:\s*$')
    xmin_pattern = re.compile(r'^\s*xmin\s*=\s*([\d.]+)\s*$')
    xmax_pattern = re.compile(r'^\s*xmax\s*=\s*([\d.]+)\s*$')
    text_pattern = re.compile(r'^\s*text\s*=\s*"(.*)"\s*$')
    intervals = []
    i = 0
    while i < len(lines):
        line = lines[i].rstrip('\n')
        header_match = interval_header_pattern.match(line)
        if header_match:
            interval_info = {'header_line_index': i, 'xmin_line_index': None, 'xmax_line_index': None, 'text_line_index': None, 'xmin': None, 'xmax': None, 'text': None}
            i += 1
            while i < len(lines) and not interval_header_pattern.match(lines[i].rstrip('\n')):
                sub_line = lines[i].rstrip('\n')
                m_xmin = xmin_pattern.match(sub_line)
                m_xmax = xmax_pattern.match(sub_line)
                m_text = text_pattern.match(sub_line)
                if m_xmin:
                    interval_info['xmin_line_index'] = i
                    interval_info['xmin'] = float(m_xmin.group(1))
                elif m_xmax:
                    interval_info['xmax_line_index'] = i
                    interval_info['xmax'] = float(m_xmax.group(1))
                elif m_text:
                    interval_info['text_line_index'] = i
                    interval_info['text'] = m_text.group(1)
                i += 1
            intervals.append(interval_info)
        else:
            i += 1
    for idx in range(len(intervals)-1):
        current_int = intervals[idx]
        next_int = intervals[idx+1]
        if current_int['xmax'] != next_int['xmin']:
            avg = round((current_int['xmax'] + next_int['xmin'])/2.0, 2)
            current_int['xmax'] = avg
            next_int['xmin'] = avg
    for interval_info in intervals:
        if interval_info['xmin_line_index'] is not None:
            new_xmin_str = f"xmin = {interval_info['xmin']}"
            lines[interval_info['xmin_line_index']] = _replace_line_keep_indentation(lines[interval_info['xmin_line_index']], new_xmin_str)
        if interval_info['xmax_line_index'] is not None:
            new_xmax_str = f"xmax = {interval_info['xmax']}"
            lines[interval_info['xmax_line_index']] = _replace_line_keep_indentation(lines[interval_info['xmax_line_index']], new_xmax_str)
    with open(textgrid_path, "w", encoding="utf-8") as f:
        f.writelines(lines)

def _replace_line_keep_indentation(original_line, new_content):
    leading_ws = original_line[:len(original_line)-len(original_line.lstrip())]
    return leading_ws+new_content+"\n"

def merge_silent_intervals(input_path, output_path):
    with open(input_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    blocks = []
    current_block = []
    for line in lines:
        if re.match(r'^\s*intervals\s*\[\s*\d+\s*\]:', line):
            if current_block:
                blocks.append(current_block)
            current_block = [line]
        else:
            current_block.append(line)
    if current_block:
        blocks.append(current_block)
    merged_blocks = []
    previous_was_silent = False
    for block in blocks:
        is_silent = False
        for line in block:
            m = re.match(r'^\s*text\s*=\s*"(.*)"\s*$', line)
            if m:
                if m.group(1) == "s/":
                    is_silent = True
                break
        if is_silent and previous_was_silent:
            continue
        merged_blocks.append(block)
        previous_was_silent = is_silent
    with open(output_path, "w", encoding="utf-8") as f:
        for block in merged_blocks:
            for line in block:
                f.write(line)

def update_silent_intervals_timecodes(input_path, output_path):
    with open(input_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    preamble = []
    first_interval_index = 0
    for i, line in enumerate(lines):
        if re.match(r'^\s*intervals\s*\[\s*\d+\s*\]:', line):
            first_interval_index = i
            break
        preamble.append(line)
    blocks = []
    current_block = []
    for line in lines[first_interval_index:]:
        if re.match(r'^\s*intervals\s*\[\s*\d+\s*\]:', line):
            if current_block:
                blocks.append(current_block)
            current_block = [line]
        else:
            current_block.append(line)
    if current_block:
        blocks.append(current_block)
    for idx, block in enumerate(blocks):
        silent = False
        for line in block:
            m = re.match(r'^\s*text\s*=\s*"(.*)"\s*$', line)
            if m and m.group(1) == "s/":
                silent = True
                break
        if silent:
            if idx > 0 and idx < len(blocks)-1:
                prev_block = blocks[idx-1]
                prev_xmax = None
                for line in prev_block:
                    m = re.match(r'^\s*xmax\s*=\s*([\d.]+)', line)
                    if m:
                        prev_xmax = m.group(1)
                        break
                next_block = blocks[idx+1]
                next_xmin = None
                for line in next_block:
                    m = re.match(r'^\s*xmin\s*=\s*([\d.]+)', line)
                    if m:
                        next_xmin = m.group(1)
                        break
                if prev_xmax is not None and next_xmin is not None:
                    for i_line, line in enumerate(block):
                        if re.match(r'^\s*xmin\s*=', line):
                            indent = re.match(r'^(\s*)', line).group(1)
                            block[i_line] = f"{indent}xmin = {prev_xmax}\n"
                        elif re.match(r'^\s*xmax\s*=', line):
                            indent = re.match(r'^(\s*)', line).group(1)
                            block[i_line] = f"{indent}xmax = {next_xmin}\n"
    updated_lines = preamble
    for block in blocks:
        updated_lines.extend(block)
    with open(output_path, "w", encoding="utf-8") as f:
        f.writelines(updated_lines)

def renumber_textgrid_intervals(input_path, output_path):
    with open(input_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    new_lines = []
    start_num = None
    new_index = None
    interval_count = 0
    header_pattern = re.compile(r'^(\s*intervals\s*\[)\s*(\d+)\s*(\]:.*)$')
    for line in lines:
        m = header_pattern.match(line)
        if m:
            if start_num is None:
                start_num = int(m.group(2))
                new_index = start_num
            new_line = f"{m.group(1)}{new_index}{m.group(3)}\n"
            new_lines.append(new_line)
            new_index += 1
            interval_count += 1
        else:
            new_lines.append(line)
    final_lines = []
    size_pattern = re.compile(r'^(\s*intervals:\s*size\s*=\s*)\d+')
    size_updated = False
    for line in new_lines:
        m = size_pattern.match(line)
        if m and not size_updated:
            new_line = f"{m.group(1)}{interval_count}\n"
            final_lines.append(new_line)
            size_updated = True
        else:
            final_lines.append(line)
    with open(output_path, "w", encoding="utf-8") as f:
        f.writelines(final_lines)

def unk_eps(input_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    pattern = "s/|/s|\\\\s|s\\\\"
    def repl(match):
        start, end = match.start(), match.end()
        left_flanked = (start > 0 and content[start - 1] == '"')
        right_flanked = (end < len(content) and content[end] == '"')
        if left_flanked and right_flanked:
            return "<eps>"
        else:
            return "<unk>"
    new_content = re.sub(pattern, repl, content)
    with open(input_file, 'w', encoding='utf-8') as f:
        f.write(new_content)

def batch_srt_to_textgrid(folder):
    total_srt_files = glob.glob(os.path.join(folder, "*.srt"))
    for srt_file in total_srt_files:
        if any(x in srt_file for x in ["_temp.srt", "_s2.srt", "_renumbered.srt", "_silence_inserted.srt", "_initial_silence.srt"]):
            continue
        corresponding_textgrid = srt_file.replace(".srt", ".TextGrid")
        process_entirety(srt_file)
        fix_overlapping_intervals(corresponding_textgrid)
        merge_silent_intervals(corresponding_textgrid, corresponding_textgrid)
        update_silent_intervals_timecodes(corresponding_textgrid, corresponding_textgrid)
        renumber_textgrid_intervals(corresponding_textgrid, corresponding_textgrid)
        unk_eps(corresponding_textgrid)
        print(f"wrote {corresponding_textgrid}")

batch_srt_to_textgrid(folder)