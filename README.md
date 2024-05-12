# Track My Comments

Track My Comments is a Visual Studio Code extension that helps you manage and navigate through comments in your codebase efficiently. With this extension, you can easily generate a Markdown file listing all the comments in your project, allowing you to keep track of important notes, to-dos, or annotations scattered across your code.

## Key Features:

- **Automatic Comment Tracking**: Automatically scans your codebase for comments and generates a Markdown file with clickable links to each comment's location.
- **Clickable Links**: Markdown file contains clickable links that allow you to navigate directly to the source code where each comment is located.
- **Enhanced Productivity**: Streamline your workflow by centralizing all your comments in one organized document, making it easier to review, prioritize, and manage tasks.

## How to Use:

1. Install the extension from the Visual Studio Code Marketplace.
2. Open your project in Visual Studio Code.
3. Use #TODO in your comments eg.

```
<!-- #TODO This is a comment that will be tracked -->

// #TODO This is another comment that will be tracked
```

4. Save your files to trigger the extension to scan for comments automatically.
5. Access the generated Markdown file named `comments.md` in the root folder to view and navigate through your comments efficiently.

## Contributions and Bug Reports:

Contributions and bug reports are welcome! Feel free to submit pull requests, open issues, or suggest new features on [GitHub](https://github.com/Ginger-Stone/Track-My-Comments.git).

## License:

This extension is licensed under the [MIT License](https://github.com/Ginger-Stone/Track-My-Comments?tab=MIT-1-ov-file).

## Known Issues

- The URLs linking back to the files within comments.md can potentially be too long and need to be shortened.

# Release Notes

## 1.2.0

### Features

- Added TODO highlighting
- Comments.md is automatically added to .gitignore
- Ability to scan all files and update comments now available
- Clean up improved and files with no comments are no longer added to comments.md

## 1.0.3

### Features

- Initial release
- Automatic Comment Tracking
- Automatic navigation to comment location upon clicking a comment in the comments.md file

---
