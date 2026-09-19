export const LANGUAGE_VERSIONS = {
	python: { name: "Python 3", lang: "python" },
	cpp: { name: "C++", lang: "cpp" },
	c: { name: "C", lang: "c" },
	java: { name: "Java", lang: "java" },
	javascript: { name: "JavaScript", lang: "javascript" },
	typescript: { name: "TypeScript", lang: "typescript" },
	go: { name: "Go", lang: "go" },
	rust: { name: "Rust", lang: "rust" },
	csharp: { name: "C#", lang: "csharp" },
	ruby: { name: "Ruby", lang: "ruby" },
	php: { name: "PHP", lang: "php" },
	swift: { name: "Swift", lang: "swift" },
	kotlin: { name: "Kotlin", lang: "kotlin" },
	scala: { name: "Scala", lang: "scala" },
	r: { name: "R", lang: "r" },
	perl: { name: "Perl", lang: "perl" },
	bash: { name: "Bash", lang: "bash" },
	haskell: { name: "Haskell", lang: "haskell" },
	lua: { name: "Lua", lang: "lua" },
	pascal: { name: "Pascal", lang: "pascal" },
	sql: { name: "SQL", lang: "sql" },
};

export const DEFAULT_CODE = {
	python: `# Code Now
def main():
    print("Hello Hacker!")

if __name__ == "__main__":
    main()
`,

	cpp: `// Code Now
#include <iostream>

using namespace std;

int main() {
    cout << "Hello Hacker!" << endl;
    return 0;
}
`,

	c: `// Code Now
#include <stdio.h>

int main() {
    printf("Hello Hacker!\\n");
    return 0;
}
`,

	java: `// Code Now
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello Hacker!");
    }
}
`,

	javascript: `// Code Now
function main() {
    console.log("Hello Hacker!");
}

main();
`,

	typescript: `// Code Now
function main(): void {
    console.log("Hello Hacker!");
}

main();
`,

	go: `// Code Now
package main

import "fmt"

func main() {
    fmt.Println("Hello Hacker!")
}
`,

	rust: `// Code Now
fn main() {
    println!("Hello Hacker!");
}
`,

	csharp: `// Code Now
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello Hacker!");
    }
}
`,

	ruby: `# Code Now
puts "Hello Hacker!"
`,

	php: `<?php
// Code Now
echo "Hello Hacker!\n";
?>
`,

	swift: `// Code Now
import Foundation

print("Hello Hacker!")
`,

	kotlin: `// Code Now
fun main() {
    println("Hello Hacker!")
}
`,

	scala: `// Code Now
object Main {
  def main(args: Array[String]): Unit = {
    println("Hello Hacker!")
  }
}
`,

	r: `# Code Now
cat("Hello Hacker!\n")
`,

	perl: `# Code Now
print "Hello Hacker!\n";
`,

	bash: `#!/bin/bash
# Code Now
echo "Hello Hacker!"
`,

	haskell: `-- Code Now
main :: IO ()
main = putStrLn "Hello Hacker!"
`,

	lua: `-- Code Now
print("Hello Hacker!")
`,

	pascal: `// Code Now
program Main;
begin
  writeln('Hello Hacker!');
end.
`,

	sql: `-- Code Now
SELECT 'Hello Hacker!' AS Message;
`,
};
