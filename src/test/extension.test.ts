import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { getComment, getComments } from "../extension";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Sample test", () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });

  test("Adding Comment", () => {
    let startPos = 0;
    let page =
      "#TODO new todo\n\
	   This is new\n\
	   A new line\n\
	   #TODO this\n";
    let comments: string[] = [];
    let nextStartPos = getComment(startPos, page, comments); //runs once and fetches the first comment found from the startPos
    assert.equal(JSON.stringify(comments), JSON.stringify(["#TODO new todo"]));
    assert.equal(
      nextStartPos,
      15,
      "Not returning the next TODO position expected"
    );

    let fileName =
      "c:/Users/ADMIN/Documents_WorkFolder/Web Dev Work/Extensions/Test files/A file testing comments.txt";

    let result = getComments(fileName, page); //runs recursively and fetches all the comments found in the page. Has getComment() within it
    assert.equal(
      JSON.stringify(result),
      JSON.stringify(["#TODO new todo", "#TODO this"]),
      "The TODOs have not been added correctly"
    );
  });

  // #TODO add more tests...
});
