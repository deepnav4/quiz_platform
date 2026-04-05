import mammoth

with open("file-6.docx", "rb") as docx_file:
    result = mammoth.extract_raw_text(docx_file)
    text = result.value

with open("output4.txt", "w", encoding="utf-8") as f:
    f.write(text)

print(" Done! Text saved to output.txt")