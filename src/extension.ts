import path from "path";
import * as vscode from "vscode";
const fs = require("fs");

const FLAG_KEY = "extension.addToGitIgnoreDone";

export function appendMarkdown(markdownContent: string) {
  // Check if workspace is open and get rootPath
  const rootPath = vscode.workspace.rootPath;
  if (rootPath) {
    const markdownFilePath = `${rootPath}/comments.md`;
    fs.appendFile(markdownFilePath, markdownContent, function (err: any) {
      if (err) {
        console.error("Error appending to Markdown file:", err);
        vscode.window.showErrorMessage(
          "Error appending to Markdown file. Please save again."
        );
        throw err;
      }
    });
  } else {
    console.error("Workspace folder not found.");
    vscode.window.showErrorMessage("Workspace folder not found.");
  }
}

// This cleans up after all comments have been removed from a file
export function removeFileBlock(fileName: string) {
  const rootPath = vscode.workspace.rootPath;
  const markdownFilePath = `${rootPath}/comments.md`;
  const fileCommentsStart = `## ${fileName}`;
  const fileCommentsEnd = `## END OF ${fileName}`;

  if (fs.existsSync(markdownFilePath)) {
    let data: string = fs.readFileSync(markdownFilePath, "utf8");

    // Replace fileCommentsStart, fileCommentsEnd and blank consecutive lines with a single new line -- used to remove file blocks when the comments have been removed from file
    data = data.replace(
      new RegExp(
        `${fileCommentsStart}[\\s\\S]*?${fileCommentsEnd}|\\n{2,}|${fileCommentsStart}|${fileCommentsEnd}`,
        "g"
      ),
      "\n"
    );

    replaceExistingMarkdown(data.trim());
  }
}

export function replaceExistingMarkdown(markdownContent: string) {
  // Check if workspace is open and get rootPath
  const rootPath = vscode.workspace.rootPath;
  if (rootPath) {
    const markdownFilePath = `${rootPath}/comments.md`;
    fs.writeFileSync(markdownFilePath, markdownContent, function (err: any) {
      if (err) {
        console.error("Error appending to Markdown file:", err);
        vscode.window.showErrorMessage(
          "Error appending to Markdown file. Please save again."
        );
        throw err;
      }
    });
  } else {
    console.error("Workspace folder not found.");
    vscode.window.showErrorMessage("Workspace folder not found.");
  }
}

export function generateMarkdown(
  fullFilenamePath: string,
  comments: string[],
  fileName: string
) {
  const rootPath = vscode.workspace.rootPath;
  const markdownFilePath = `${rootPath}/comments.md`;
  const fileCommentsStart = `## ${fileName}`;
  const fileCommentsEnd = `## END OF ${fileName}`;

  if (fs.existsSync(markdownFilePath)) {
    let data: string = fs.readFileSync(markdownFilePath, "utf8");

    // Replace blank consecutive lines with a single new line
    data = data.replace(
      new RegExp(
        `${fileCommentsStart}[\\s\\S]*?${fileCommentsEnd}|\\n{2,}`,
        "g"
      ),
      "\n"
    );

    replaceExistingMarkdown(data.trim());
  }

  let markdown = `\n\n${fileCommentsStart}\n`;

  comments.forEach((comment) => {
    const args = [fullFilenamePath, comment];
    const myCommandUri = vscode.Uri.parse(
      `command:track-my-comments.openFile?${encodeURIComponent(
        JSON.stringify(args)
      )}`
    );
    markdown += `- [${comment}](${myCommandUri})\n`;
  });

  markdown += `\n${fileCommentsEnd}\n`;

  return markdown;
}

export function getComment(
  startPos: number,
  page: string,
  comments: string[]
): number {
  let i = page.indexOf("#TODO", startPos);
  let comment = "#";
  while (page[i++] !== "\n" && i < page.length - 1) {
    comment += page[i];
  }
  comments.push(comment.trimEnd());
  return i; //return the next start pos
}

export function getComments(fileName: string, page: string) {
  let comments: any[] = [];
  let currStartPos: number = 0;
  while (
    page.includes("#TODO", currStartPos) &&
    !fileName.includes("comments.md")
  ) {
    currStartPos = getComment(currStartPos, page, comments);
  }
  console.log(fileName, comments);
  return comments;
}

// Function to clear the contents of the Markdown file
function clearMarkdownFile() {
  const rootPath = vscode.workspace.rootPath;
  const markdownFilePath = `${rootPath}/comments.md`;
  fs.writeFileSync(markdownFilePath, "", "utf8");
}

export function activate(context: vscode.ExtensionContext) {
  if (!context.globalState.get<boolean>(FLAG_KEY)) {
    addToGitIgnore(context);
    context.globalState.update(FLAG_KEY, true);
  }

  const todoDecorationType = vscode.window.createTextEditorDecorationType({
    color: "orange", // Set the color to orange
  });

  // Track active text editors
  let activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    triggerUpdateDecorations();
  }

  // Update the decorations when the active text editor changes
  vscode.window.onDidChangeActiveTextEditor(
    (editor) => {
      activeEditor = editor;
      if (editor) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions
  );

  // Update the decorations when the document content changes
  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (activeEditor && event.document === activeEditor.document) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions
  );

  // Update the decorations
  function triggerUpdateDecorations() {
    if (!activeEditor) {
      return;
    }

    const isMarkdown = activeEditor.document.languageId === "markdown"; // Check if the document is Markdown
    if (isMarkdown) {
      // If the document is Markdown, remove existing decorations
      activeEditor.setDecorations(todoDecorationType, []);
      return;
    }

    const regExp = /#TODO.*/g; // Adjust regex to match the entire line
    const text = activeEditor.document.getText();
    const decorations: vscode.DecorationOptions[] = [];
    let match;
    while ((match = regExp.exec(text))) {
      const startPos = activeEditor.document.positionAt(match.index);
      const endPos = activeEditor.document.lineAt(startPos.line).range.end; // End position at the end of the line
      const decoration = { range: new vscode.Range(startPos, endPos) };
      decorations.push(decoration);
    }
    activeEditor.setDecorations(todoDecorationType, decorations);
  }

  let tracker = vscode.commands.registerCommand(
    "track-my-comments.trackComments",
    () => {
      vscode.workspace.onDidSaveTextDocument((e) => {
        if (e.fileName.includes("comments.md")) {
          return;
        }

        let fileName = vscode.workspace.asRelativePath(e.fileName); // Getting relative file path

        let comments = getComments(e.fileName, e.getText());

        if (comments.length > 0) {
          const markdownContent = generateMarkdown(
            e.fileName,
            comments,
            fileName
          );

          if (markdownContent) {
            appendMarkdown(markdownContent);
          }
        } else {
          removeFileBlock(fileName); //clean up
        }
      });
    }
  );

  let openFile = vscode.commands.registerCommand(
    "track-my-comments.openFile",
    (uri: vscode.Uri, comment: string) => {
      vscode.workspace.openTextDocument(uri).then(
        (doc) => {
          const position = doc.getText().indexOf(comment);
          if (position !== -1) {
            const startPosition = doc.positionAt(position);
            const endPosition = doc.positionAt(position + comment.length);
            vscode.window.showTextDocument(doc).then((editor) => {
              editor.selection = new vscode.Selection(
                startPosition,
                endPosition
              );
              editor.revealRange(new vscode.Range(startPosition, endPosition));
            });
          } else {
            console.warn("Comment not found:", comment);
            vscode.window.showErrorMessage(
              "Comment not found in the document."
            );
          }
        },
        (error) => {
          console.error("Error opening document:", error);
          vscode.window.showErrorMessage("Error opening document.");
        }
      );
    }
  );

  let refreshComments = vscode.commands.registerCommand(
    "track-my-comments.refreshComments",
    () => {
      clearMarkdownFile();
      // Iterate through all files in the workspace
      vscode.workspace.findFiles("**/*").then((files) => {
        files.forEach(async (fileUri) => {
          const workspaceRoot = vscode.workspace.rootPath; // Get the root path of the workspace

          if (workspaceRoot) {
            // `workspaceRoot` is a valid string
            const fileName = fileUri.fsPath; // Relative path to the file
            const fullFilePath = vscode.Uri.joinPath(
              vscode.Uri.file(workspaceRoot),
              fileName
            ).fsPath;
            // Now `fullFilePath` contains the full path to the file

            if (fileName.includes("comments.md")) {
              return;
            }
            // Read the content of the file
            const fileContent = fs.readFileSync(fileName, "utf8");
            // Extract comments from the file content
            const comments = getComments(fileName, fileContent);

            if (comments.length > 0) {
              const markdownContent = generateMarkdown(
                fullFilePath,
                comments,
                fileName
              );

              if (markdownContent) {
                appendMarkdown(markdownContent);
              }
            } else {
              removeFileBlock(fileName); //clean up
            }
          } else {
            // `workspaceRoot` is undefined, handle this case accordingly
            console.error("Workspace root is undefined.");
          }
        });
      });
    }
  );

  vscode.commands.executeCommand("track-my-comments.trackComments");
  context.subscriptions.push(tracker, openFile, refreshComments);
}

async function addToGitIgnore(context: vscode.ExtensionContext) {
  const activeWorkspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!activeWorkspaceFolder) {
    vscode.window.showErrorMessage("No workspace folder found.");
    return;
  }

  const gitIgnorePath = vscode.Uri.joinPath(
    activeWorkspaceFolder.uri,
    ".gitignore"
  );

  try {
    await vscode.workspace.fs.stat(gitIgnorePath);
  } catch (error) {
    if (
      error instanceof vscode.FileSystemError &&
      error.code === "FileNotFound"
    ) {
      // .gitignore file does not exist, create it
      try {
        await vscode.workspace.fs.writeFile(gitIgnorePath, Buffer.from(""));
        vscode.window.showInformationMessage(".gitignore file created.");
      } catch (error) {
        vscode.window.showErrorMessage(
          `Error creating .gitignore file: ${error}`
        );
        return;
      }
    } else {
      vscode.window.showErrorMessage(
        `Error accessing .gitignore file: ${error}`
      );
      return;
    }
  }

  // Add comments.md to .gitignore
  try {
    const gitIgnoreContent = await vscode.workspace.fs.readFile(gitIgnorePath);
    if (!gitIgnoreContent.toString().includes("comments.md")) {
      const updatedContent = `${gitIgnoreContent.toString()}\ncomments.md\n`;
      await vscode.workspace.fs.writeFile(
        gitIgnorePath,
        Buffer.from(updatedContent)
      );
      vscode.window.showInformationMessage("Added comments.md to .gitignore.");
    } else {
      vscode.window.showInformationMessage(
        "comments.md is already in .gitignore."
      );
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error reading or writing to .gitignore: ${error}`
    );
  }
}

export function deactivate() {}
