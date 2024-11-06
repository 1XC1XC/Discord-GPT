#!/bin/bash

# find ./whisper/src -maxdepth 2 -type f -name "*.py" -exec bash -c '
#     append_to_clipboard "$1"
# ' _ {} \;
#
# find . -maxdepth 2 -type f -name "package.json" -exec bash -c '
#     append_to_clipboard "$1"
# ' _ {} \;
#
# find . -maxdepth 2 -type f -name "*.js" -exec bash -c '
#     append_to_clipboard "$1"
# ' _ {} \;

append_to_clipboard() {
    local file_path="$1"
    echo -e "${file_path}:\n\`\`\`"
    cat "${file_path}" | sed 's/^\s+//' | sed 's/\s+$//'
    echo -e "\`\`\`"
}

export -f append_to_clipboard

copy_files() {
    local path="$1"
    local maxdepth="$2"
    local pattern="$3"
    find "${path}" -maxdepth "${maxdepth}" -type f -name "${pattern}" -exec bash -c '
        append_to_clipboard "$1"
    ' _ {} \;
}

echo "Copying contents to clipboard..."
(
    tree -L 2

    copy_files "./whisper/src" 2 "*.py"
    copy_files "./whisper/src" 2 "*.js"
    copy_files "./whisper/src" 2 "package.json"

    copy_files "." 2 "package.json"
    copy_files "." 2 "*.js"
) | xsel --clipboard

echo "Contents copied to clipboard."
