#!/usr/bin/env python3
"""
Robust script to convert ML Research.xml flashcard deck into separate markdown files.
Handles malformed XML with unescaped characters and resolves blob references to files/ links.
"""

import re
import os
import base64
import shutil
from pathlib import Path

def clean_html_tags(text):
    """Remove HTML tags and clean up the text."""
    if not text:
        return ""
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Clean up whitespace
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    return text

def sanitize_filename(filename):
    """Convert a string to a valid filename."""
    # Remove or replace invalid characters
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Remove extra whitespace and limit length
    filename = re.sub(r'\s+', '_', filename.strip())
    filename = filename[:100]  # Limit length
    return filename

def get_file_extension(file_path):
    """Determine the correct file extension based on file content."""
    try:
        import subprocess
        result = subprocess.run(['file', str(file_path)], capture_output=True, text=True)
        file_type = result.stdout.lower()
        
        if 'png' in file_type:
            return '.png'
        elif 'jpeg' in file_type or 'jpg' in file_type:
            return '.jpg'
        elif 'gif' in file_type:
            return '.gif'
        elif 'svg' in file_type:
            return '.svg'
        elif 'pdf' in file_type:
            return '.pdf'
        else:
            # Default to .bin for unknown types
            return '.bin'
    except:
        # Fallback to .bin if file command fails
        return '.bin'

def ensure_blobs_in_public_files(
    blobs_dir: str = "blobs",
    legacy_files_dir: str = "files",
    public_files_dir: str = "website/public/files",
):
    """Ensure blobs are available under website/public/files with proper extensions.

    - Moves any files under 'blobs/' to 'website/public/files/<hash>.<ext>' (detects ext).
    - Migrates legacy files under 'files/' (no extension) to public files with detected ext.
    - Skips if a destination with same hash already exists.
    """
    blobs_path = Path(blobs_dir)
    legacy_path = Path(legacy_files_dir)
    public_path = Path(public_files_dir)
    public_path.mkdir(parents=True, exist_ok=True)

    def already_exists_for(hash_name: str) -> bool:
        return any(public_path.glob(f"{hash_name}.*"))

    moved = 0

    # Migrate from blobs/
    if blobs_path.exists():
        for blob in blobs_path.iterdir():
            if not blob.is_file():
                continue
            hash_name = blob.name
            if already_exists_for(hash_name):
                continue
            ext = get_file_extension(blob)
            dest = public_path / f"{hash_name}{ext}"
            shutil.move(str(blob), str(dest))
            moved += 1

        # Remove empty blobs directory
        try:
            if blobs_path.exists() and not any(blobs_path.iterdir()):
                blobs_path.rmdir()
        except Exception:
            pass

    # Migrate from legacy files/ without extension
    if legacy_path.exists():
        for f in legacy_path.iterdir():
            if not f.is_file():
                continue
            hash_name = f.name
            # If file already has an extension, skip legacy migration
            if "." in hash_name:
                continue
            if already_exists_for(hash_name):
                continue
            ext = get_file_extension(f)
            dest = public_path / f"{hash_name}{ext}"
            try:
                shutil.copy2(str(f), str(dest))
                moved += 1
            except Exception:
                # best-effort
                pass

    if moved:
        print(f"Moved/Migrated {moved} blob files to {public_files_dir}")

def blob_to_markdown_link(blob_hash: str, public_files_dir: str = "website/public/files") -> str:
    """Return a markdown image or file link pointing to /files/<hash>.<ext>.

    Assumes ensure_blobs_in_public_files() has been called beforehand.
    """
    public_path = Path(public_files_dir)
    matches = list(public_path.glob(f"{blob_hash}.*"))
    if not matches:
        return f"[Missing blob: {blob_hash}]"
    f = matches[0]
    ext = f.suffix.lower()
    name = f.name
    # images get ![]; others get []
    if ext in [".png", ".jpg", ".jpeg", ".gif", ".svg"]:
        return f"![Image](files/{name})"
    return f"[File](files/{name})"

def process_content_with_blobs(content):
    """Process content and convert blob references to public files links."""
    # Pattern to match blob references: {{blob <hash>}}
    blob_pattern = r'\{\{blob\s+([a-f0-9]+)\}\}'
    
    # Find all blob references
    blob_matches = re.findall(blob_pattern, content)
    
    # Replace each blob reference with files/ link
    for blob_hash in blob_matches:
        replacement = blob_to_markdown_link(blob_hash)
        content = content.replace(f"{{{{blob {blob_hash}}}}}", replacement)
    
    return content

def extract_cards_from_xml(xml_content):
    """Extract cards from XML content using regex patterns."""
    cards = []
    
    # Pattern to match card elements
    card_pattern = r'<card>(.*?)</card>'
    card_matches = re.findall(card_pattern, xml_content, re.DOTALL)
    
    for card_content in card_matches:
        # Extract front content
        front_pattern = r'<rich-text name=\'Front\'>(.*?)</rich-text>'
        front_match = re.search(front_pattern, card_content, re.DOTALL)
        front_content = front_match.group(1) if front_match else ""
        
        # Extract back content
        back_pattern = r'<rich-text name=\'Back\'>(.*?)</rich-text>'
        back_match = re.search(back_pattern, card_content, re.DOTALL)
        back_content = back_match.group(1) if back_match else ""
        
        # Process content to convert blob references to base64
        front_content = process_content_with_blobs(front_content)
        back_content = process_content_with_blobs(back_content)
        
        cards.append({
            'front': clean_html_tags(front_content),
            'back': clean_html_tags(back_content)
        })
    
    return cards

def convert_xml_to_markdown(xml_file_path, output_dir="markdown_cards"):
    """Convert XML flashcard deck to separate markdown files."""
    
    # Create output directory
    Path(output_dir).mkdir(exist_ok=True)
    # Ensure blobs are available under website/public/files before processing
    ensure_blobs_in_public_files()
    
    # Read XML file
    with open(xml_file_path, 'r', encoding='utf-8') as f:
        xml_content = f.read()
    
    # Extract cards
    cards = extract_cards_from_xml(xml_content)
    
    print(f"Found {len(cards)} cards in the deck")
    
    for i, card in enumerate(cards, 1):
        front_content = card['front']
        back_content = card['back']
        
        # Create filename from front content or use card number
        if front_content:
            # Take first 50 characters of front content for filename
            filename_base = sanitize_filename(front_content[:50])
            filename = f"{i:03d}_{filename_base}.md"
        else:
            filename = f"{i:03d}_card.md"
        
        # Create markdown content
        markdown_content = f"""# Card {i}

## Front
{front_content}

## Back
{back_content}
"""
        
        # Write to file
        file_path = Path(output_dir) / filename
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(markdown_content)
        
        print(f"Created: {filename}")
    
    print(f"\nConversion complete! {len(cards)} markdown files created in '{output_dir}' directory.")

import glob

def main(*paths: str, output_dir: str = "website/markdown_cards"):
    """Main function to run the conversion."""
    if not paths:
        print("Error: No file paths provided")
        return
    
    # Handle multiple file paths
    xml_files = []
    for path in paths:
        if '*' in path or '?' in path:
            # Handle glob patterns
            xml_files.extend(glob.glob(path))
        else:
            xml_files.append(path)
    
    if not xml_files:
        print(f"Error: No files found")
        return
    
    for xml_file in xml_files:
        if not os.path.exists(xml_file):
            print(f"Error: {xml_file} not found")
            continue
            
        print(f"\nProcessing: {xml_file}")
        # Create a subdirectory for each XML file
        print(f"Output directory: {output_dir}")
        file_output_dir = os.path.join(output_dir, os.path.splitext(os.path.basename(xml_file))[0])
        print(f"Creating markdown files in: {file_output_dir}")
        convert_xml_to_markdown(xml_file, file_output_dir)
        print(f"\nConversion complete! markdown files created in '{file_output_dir}' directory.")
        
if __name__ == "__main__":
    try:
        import fire  # type: ignore
        fire.Fire(main)
    except Exception:
        # Fallback: simple CLI usage: python xml_to_markdown.py <xml> [<xml2> ...]
        import sys
        args = sys.argv[1:]
        if not args:
            print("Usage: python xml_to_markdown.py <xml> [<xml2> ...]")
            sys.exit(1)
        main(*args)
