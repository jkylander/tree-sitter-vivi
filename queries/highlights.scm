; Comments
(comment) @comment

; Keywords
[
  "defer"
  "panic"
] @keyword

[ "struct" ] @keyword.type

[ "return"] @keyword.return

[ "for" "while"] @keyword.repeat

[ "fn" ] @keyword.function

[
 "ext"
] @keyword.import

[
  "if"
  "else"
  "switch"
  "default"
] @keyword.conditional

[
  "try"
  "catch"
] @keyword.exception

; Operators
[
  "+"
  "++"
  "+="
  "-"
  "--"
  "-="
  "*"
  "*="
  "/"
  "/="
  "="
  "!"
  ":="
  "::"
  "=="
  "!="
  "|"
  "||"
  "&&"
  "~"
  "<"
  ">"
  "<="
  ">="
] @operator

["and" "or" "not" "in"] @keyword.operator

; Punctuations
[
  ","
  "."
  ";"
] @punctuation.delimiter

[
  "{"
  "}"
  "("
  ")"
  "["
  "]"
] @punctuation.bracket

["{" "}"] @punctuation.special

; Literals
(string_literal) @string
((number_literal) @number (#set! priority 90))
(null_literal) @constant
(bool_literal) @boolean

; Function / method declaration
(function_declaration
  name: (identifier) @function
)

(call_expression function: (identifier) @function)
(call_expression arguments: (argument_list) @variable.parameter)


; Method call
(call_expression
  function: (member_expression
  (identifier) @function.method.call
  )
)

; Variable
((identifier) @variable (#set! priority 90))
