#!/usr/bin/env python3
"""
Script to fix blob references in markdown files by:
1. Moving blob files to a 'files' folder
2. Replacing blob references with proper image links
"""

import os
import re
import shutil
from pathlib import Path

def move_blobs_to_files_folder():
    """Move all blob files from blobs/ to files/ folder."""
    blobs_dir = Path("blobs")
    files_dir = Path("files")
    
    if not blobs_dir.exists():
        print("No blobs directory found!")
        return
    
    # Create files directory if it doesn't exist
    files_dir.mkdir(exist_ok=True)
    
    # Move all blob files
    blob_files = list(blobs_dir.glob("*"))
    moved_count = 0
    
    for blob_file in blob_files:
        if blob_file.is_file():
            # Determine file extension based on content
            file_extension = get_file_extension(blob_file)
            new_filename = f"{blob_file.name}{file_extension}"
            new_path = files_dir / new_filename
            
            # Move the file
            shutil.move(str(blob_file), str(new_path))
            moved_count += 1
            print(f"Moved: {blob_file.name} -> files/{new_filename}")
    
    print(f"Moved {moved_count} blob files to files/ directory")
    
    # Remove empty blobs directory
    if blobs_dir.exists() and not any(blobs_dir.iterdir()):
        blobs_dir.rmdir()
        print("Removed empty blobs/ directory")

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

def replace_blob_references_in_markdown():
    """Replace blob references in markdown files with proper image links."""
    markdown_dir = Path("markdown_cards")
    files_dir = Path("files")
    
    if not markdown_dir.exists():
        print("No markdown_cards directory found!")
        return
    
    # Pattern to match blob references: {{blob <hash>}}
    blob_pattern = r'\{\{blob\s+([a-f0-9]+)\}\}'
    
    markdown_files = list(markdown_dir.glob("*.md"))
    updated_count = 0
    
    for md_file in markdown_files:
        if md_file.name == "README.md":
            continue  # Skip README file
            
        with open(md_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Find all blob references
        blob_matches = re.findall(blob_pattern, content)
        
        for blob_hash in blob_matches:
            # Check if the blob file exists in files directory
            blob_files = list(files_dir.glob(f"{blob_hash}.*"))
            
            if blob_files:
                # Use the first matching file
                blob_file = blob_files[0]
                file_extension = blob_file.suffix
                
                # Determine if it's an image based on extension
                if file_extension.lower() in ['.png', '.jpg', '.jpeg', '.gif', '.svg']:
                    # Replace with markdown image link
                    replacement = f"![Image](files/{blob_file.name})"
                else:
                    # Replace with file link
                    replacement = f"[File](files/{blob_file.name})"
                
                # Replace the blob reference
                content = content.replace(f"{{{{blob {blob_hash}}}}}", replacement)
            else:
                # If blob file not found, replace with a note
                content = content.replace(f"{{{{blob {blob_hash}}}}}", f"[Missing blob: {blob_hash}]")
        
        # Write back if content changed
        if content != original_content:
            with open(md_file, 'w', encoding='utf-8') as f:
                f.write(content)
            updated_count += 1
            print(f"Updated: {md_file.name}")
    
    print(f"Updated {updated_count} markdown files")

def main():
    """Main function to fix blob references."""
    print("Starting blob reference fix...")
    
    # Step 1: Move blob files to files folder
    print("\n1. Moving blob files to files/ directory...")
    move_blobs_to_files_folder()
    
    # Step 2: Replace blob references in markdown files
    print("\n2. Replacing blob references in markdown files...")
    replace_blob_references_in_markdown()
    
    print("\nBlob reference fix complete!")

if __name__ == "__main__":
    main()
