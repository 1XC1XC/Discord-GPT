#!/bin/bash

append_to_clipboard() {
    local file_path="$1"
    echo -e "${file_path}:\n\`\`\`"
    cat "${file_path}" | sed 's/^\s+//' | sed 's/\s+$//'
    echo -e "\`\`\`"
}

export -f append_to_clipboard

copy_files() {
    local path="$1"
    local pattern="$2"
    find "${path}" -type f -name "${pattern}" -exec bash -c '
        append_to_clipboard "$1"
    ' _ {} \;
}

echo "Copying contents to clipboard..."
(
    tree -L 2

    copy_files "./src/" "*.py"
    copy_files "./src/" "*.js"
    copy_files "./src/" "package.json"
) | xsel --clipboard

echo "Contents copied to clipboard."
