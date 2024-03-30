import * as vscode from "vscode";
const fs = require("fs");

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "track-my-comments" is now active!'
  );

  let tracker = vscode.commands.registerCommand(
    "track-my-comments.trackComments",
    () => {
      vscode.workspace.onDidSaveTextDocument((e) => {
        console.log(e.fileName);
        if (e.fileName.includes("comments.md")) {
          return;
        }
        let comments: any[] = [];
        let page = e.getText();
        let fileName = vscode.workspace.asRelativePath(e.fileName); // Getting relative file path

        function appendMarkdown(markdownContent: string) {
          // Check if workspace is open and get rootPath
          const rootPath = vscode.workspace.rootPath;
          if (rootPath) {
            const markdownFilePath = `${rootPath}/comments.md`;
            fs.appendFile(
              markdownFilePath,
              markdownContent,
              function (err: any) {
                if (err) {
                  console.error("Error appending to Markdown file:", err);
                  vscode.window.showErrorMessage(
                    "Error appending to Markdown file. Please save again."
                  );
                  throw err;
                }
                vscode.window.showInformationMessage(
                  "Markdown file generated successfully."
                );
                console.log("Markdown file generated successfully.");

                // const uri = vscode.Uri.file(markdownFilePath);
                // const comment = "#TODO this also";
                // vscode.commands.executeCommand(
                //   "track-my-comments.openFile",
                //   uri,
                //   comment
                // );
              }
            );
          } else {
            console.error("Workspace folder not found.");
            vscode.window.showErrorMessage("Workspace folder not found.");
          }
        }
        function replaceExistingMarkdown(markdownContent: string) {
          // Check if workspace is open and get rootPath
          const rootPath = vscode.workspace.rootPath;
          if (rootPath) {
            const markdownFilePath = `${rootPath}/comments.md`;
            fs.writeFileSync(
              markdownFilePath,
              markdownContent,
              function (err: any) {
                if (err) {
                  console.error("Error appending to Markdown file:", err);
                  vscode.window.showErrorMessage(
                    "Error appending to Markdown file. Please save again."
                  );
                  throw err;
                }
                vscode.window.showInformationMessage(
                  "Markdown file generated successfully."
                );
                console.log("Markdown file generated successfully.");

                // const uri = vscode.Uri.file(markdownFilePath);
                // const comment = "#TODO this also";
                // vscode.commands.executeCommand(
                //   "track-my-comments.openFile",
                //   uri,
                //   comment
                // );
              }
            );
          } else {
            console.error("Workspace folder not found.");
            vscode.window.showErrorMessage("Workspace folder not found.");
          }
        }

        function generateMarkdown(comments: string[]) {
          const rootPath = vscode.workspace.rootPath;
          const markdownFilePath = `${rootPath}/comments.md`;
          const fileCommentsStart = `## ${fileName}`;
          const fileCommentsEnd = `## END OF ${fileName}`;

          if (fs.existsSync(markdownFilePath)) {
            let data: string = fs.readFileSync(markdownFilePath, "utf8");
            console.log(markdownFilePath);

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
            const args = [e.fileName, comment];
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

        const getComment = (startPos: number): number => {
          let i = page.indexOf("#TODO", startPos);
          let comment = "#";
          while (page[i++] !== "\n" && i < page.length - 1) {
            comment += page[i];
          }
          comments.push(comment.trimEnd());
          return i;
        };

        let currStartPos: number = 0;
        while (
          page.includes("#TODO", currStartPos) &&
          !e.fileName.includes("comments.md")
        ) {
          currStartPos = getComment(currStartPos);
        }

        if (comments) {
          const markdownContent = generateMarkdown(comments);

          if (markdownContent) {
            appendMarkdown(markdownContent);
          }
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
  context.subscriptions.push(tracker, openFile);
}

export function deactivate() {}
