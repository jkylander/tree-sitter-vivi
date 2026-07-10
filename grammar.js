/**
 * @file Vivi grammar for tree-sitter
 * @author Vivi Language
 * @license MIT
 */

/* eslint-disable arrow-parens */
/* eslint-disable camelcase */
/* eslint-disable-next-line spaced-comment */

const PREC = {
  ASSIGN: 1,
  TERNARY: 2,
  UNION: 3,
  OR: 4,
  AND: 5,
  EQUALITY: 6,
  COMPARE: 7,
  RANGE: 8,
  CONCAT: 9,
  ADD: 10,
  MUL: 11,
  UNARY: 12,
  POSTFIX: 13,
  CALL: 14,
  MEMBER: 15,
};

module.exports = grammar({
  name: 'vivi',

  extras: $ => [
    /\s/,
    $.comment,
  ],

  word: $ => $.identifier,

  conflicts: $ => [
    [$.struct_literal, $.block],
    [$._expression, $.type_annotation],
    [$.builtin_type, $.null_literal],
    [$.declaration_statement, $._expression],
    [$.type_mass_declaration, $.type_annotation],
    [$.for_in_clause, $.type_annotation, $._expression],
    [$.type_annotation, $.switch_case],
    [$._expression, $.switch_case],
    [$._expression, $.struct_field],
    [$.switch_case],

  ],

  inline: $ => [
    $._statement,
  ],

  rules: {
    source_file: $ => repeat($._top_level_item),

    _top_level_item: $ => choice(
      $._statement,
      $.include_statement,
      $.proctime_block,
    ),

    // ---------- Comments ----------
    comment: $ => choice(
      seq('//', /.*/),
      seq('#', /[^\n]*/),
      seq(';;', /[^\n]*/),
      seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'),
    ),

    // ---------- Includes ----------
    include_statement: $ => seq(
      '#import',
      field('path', $.string_literal),
      optional(seq('as', field('alias', $.identifier))),
    ),

    // ---------- Proctime ----------
    proctime_block: $ => seq(
      '#proctime',
      field('body', $.block),
    ),

    // ---------- Statements ----------
    _statement: $ => choice(
      $.declaration_statement,
      $.assignment_statement,
      $.expression_statement,
      $.while_statement,
      $.for_statement,
      $.switch_statement,
      $.try_statement,
      $.function_declaration,
      $.struct_declaration,
      $.type_mass_declaration,
      $.return_statement,
      $.break_statement,
      $.continue_statement,
      $.exit_statement,
      $.defer_statement,
      $.block,
      $.ext_declaration,
      $.interop_block,
    ),

    block: $ => seq(
      '{',
      repeat($._top_level_item),
      '}',
    ),

    // ---------- Declarations ----------
    declaration_statement: $ => seq(
      optional(field('type', $.type_annotation)),
      field('name', $.identifier),
      field('operator', choice('::', ':=')),
      field('value', $._expression),
    ),

    assignment_statement: $ => seq(
      field('name', $._assignable),
      field('operator', choice('=', '+=', '-=', '*=', '/=')),
      field('value', $._expression),
    ),

    _assignable: $ => choice(
      $.identifier,
      $.index_expression,
      $.member_expression,
    ),

    // expression_statement wraps expressions (like if_expression, calls, etc) 
    // into top-level valid statements
    expression_statement: $ => seq($._expression),

    ext_declaration: $ => prec(2, seq(
      'ext',
      field('name', $.identifier),
      '::',
      field('path', $.string_literal),
    )),

    type_mass_declaration: $ => seq(
      field('type', $.builtin_type),
      field('body', $.block),
    ),

    // ---------- Return / control ----------
    return_statement: $ => prec.right(seq(
      'return',
      optional($._expression),
    )),

    break_statement: $ => 'break',
    continue_statement: $ => 'continue',
    exit_statement: $ => 'exit',

    defer_statement: $ => seq(
      'defer',
      $._expression,
    ),

    // ---------- If ----------
    // Consolidated into if_expression, which can be used as a statement or assigned
    if_expression: $ => prec.right(seq(
      'if',
      field('condition', $._expression),
      field('consequence', $.block),
      repeat($.else_if_clause),
      optional($.else_clause),
    )),

    else_if_clause: $ => seq(
      'else', 'if',
      field('condition', $._expression),
      field('consequence', $.block),
    ),

    else_clause: $ => seq(
      'else',
      field('body', $.block),
    ),

    // ---------- While ----------
    while_statement: $ => seq(
      'while',
      field('condition', $._expression),
      field('body', $.block),
    ),

    // ---------- For ----------
    for_statement: $ => seq(
      'for',
      choice(
        $.for_range_clause,
        $.for_classic_clause,
        $.for_in_clause,
        $.for_kv_clause,
      ),
      field('body', $.block),
    ),

    for_range_clause: $ => seq(
      field('range', $.range_expression),
    ),

    for_classic_clause: $ => seq(
      field('init', $.declaration_statement),
      ';',
      field('condition', $._expression),
      ';',
      field('update', choice($.update_expression, $.assignment_statement)),
    ),

    for_in_clause: $ => seq(
      field('name', $.identifier),
      'in',
      field('iterable', $._expression),
    ),

    for_kv_clause: $ => seq(
      field('key', $.identifier),
      ',',
      field('value', $.identifier),
      'in',
      field('iterable', $._expression),
    ),

    // ---------- Switch ----------
    switch_statement: $ => seq(
      'switch',
      field('value', $._expression),
      '{',
      repeat($.switch_case),
      '}',
    ),

    switch_case: $ => seq(
      field('pattern', choice(
        'default',
        $.range_expression,
        $._expression,
        $.builtin_type,
      )),
      ':',
      repeat($._top_level_item),
    ),

    // ---------- Try/Catch ----------
    try_statement: $ => seq(
      'try',
      field('body', $.block),
      'catch',
      '(',
      field('error', $.identifier),
      ')',
      field('handler', $.block),
    ),

    // ---------- Interop ----------
    interop_block: $ => seq(
      '#interop',
      field('lang', $.identifier),
      field('body', $.interop_body),
    ),

    interop_body: $ => seq(
      '{',
      repeat($.extern_declaration),
      '}',
    ),

    extern_declaration: $ => seq(
      'extern',
      'fn',
      field('name', $.identifier),
      field('params', $.parameter_list),
      optional(seq('->', field('return_type', $.type_annotation))),
      ';',
    ),

    // ---------- Functions ----------
    function_declaration: $ => seq(
      'fn',
      field('name', $.identifier),
      '::',
      field('params', $.parameter_list),
      optional(seq('->', field('return_type', $.type_annotation))),
      field('body', $.block),
    ),

    anonymous_function: $ => seq(
      'fn',
      field('params', $.parameter_list),
      field('body', $.block),
    ),

    parameter_list: $ => seq(
      '(',
      commaSep($.parameter),
      ')',
    ),

    parameter: $ => seq(
      optional(field('type', $.type_annotation)),
      field('name', $.identifier),
      optional(seq(':=', field('default', $._expression))),
    ),

    // ---------- Struct ----------
    struct_declaration: $ => seq(
      'struct',
      field('name', $.identifier),
      field('body', $.struct_body),
    ),

    struct_body: $ => seq(
      '{',
      commaSep($.struct_field),
      '}',
    ),

    struct_field: $ => choice(
      seq(
        optional(field('type', $.type_annotation)),
        field('name', $.identifier),
        ':',
        field('default', $._expression),
      ),
      seq(
        field('name', $.identifier),
        ':',
        field('value', $.anonymous_function),
      ),
    ),

    struct_literal: $ => seq(
      '{',
      commaSep($.struct_literal_field),
      '}',
    ),

    struct_literal_field: $ => seq(
      field('name', choice($.identifier, $.string_literal)),
      ':',
      field('value', $._expression),
    ),

    // ---------- Types ----------
    type_annotation: $ => choice(
      $.builtin_type,
      $.union_type,
      $.identifier,
    ),

    union_type: $ => prec.left(PREC.UNION, seq(
      $.type_annotation,
      '|',
      $.type_annotation,
    )),

    builtin_type: $ => choice(
      'null', 'rune', 'string', 'bool',
      'i8', 'i16', 'i32', 'i64',
      'u8', 'u16', 'u32', 'u64',
      'f16', 'f32', 'f64',
      'enum', 'ext',
    ),

    // ---------- Expressions ----------
    _expression: $ => choice(
      $.identifier,
      $._literal,
      $.array_literal,
      $.struct_literal,
      $.binary_expression,
      $.unary_expression,
      $.update_expression,
      $.ternary_expression,
      $.range_expression,
      $.call_expression,
      $.index_expression,
      $.member_expression,
      $.union_expression,
      $.parenthesized_expression,
      $.anonymous_function,
      $.if_expression,
      $.string_interpolation,
      $.panic_expression,
      $.type_annotation,
    ),

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    panic_expression: $ => seq('panic', '(', ')'),

    union_expression: $ => prec.left(PREC.UNION, seq(
      field('left', $._expression),
      '|',
      field('right', $._expression),
    )),

    ternary_expression: $ => prec.right(PREC.TERNARY, seq(
      field('condition', $._expression),
      '?',
      field('consequence', $._expression),
      ':',
      field('alternative', $._expression),
    )),

    range_expression: $ => prec.left(PREC.RANGE, seq(
      field('start', $._expression),
      '..',
      field('end', $._expression),
    )),

    binary_expression: $ => {
      const table = [
        [PREC.OR, choice('or', '||')],
        [PREC.AND, choice('and', '&&')],
        [PREC.EQUALITY, choice('==', '!=', 'not')],
        [PREC.COMPARE, choice('<', '<=', '>', '>=', 'in')],
        [PREC.CONCAT, '~'], // Swapped to ~ 
        [PREC.ADD, choice('+', '-')],
        [PREC.MUL, choice('*', '/', '%')],
      ];

      return choice(...table.map(([precedence, operator]) =>
        prec.left(precedence, seq(
          field('left', $._expression),
          field('operator', operator),
          field('right', $._expression),
        )),
      ));
    },

    unary_expression: $ => prec(PREC.UNARY, seq(
      field('operator', choice('!', '-', '+', 'not')),
      field('operand', $._expression),
    )),

    update_expression: $ => prec(PREC.POSTFIX, seq(
      field('operand', $._expression),
      field('operator', choice('++', '--')),
    )),

    // call_expression will automatically catch things like i32(var) now
    call_expression: $ => prec(PREC.CALL, seq(
      field('function', $._expression),
      field('arguments', $.argument_list),
    )),

    argument_list: $ => seq(
      '(',
      commaSep($._expression),
      ')',
    ),

    index_expression: $ => prec(PREC.MEMBER, seq(
      field('object', $._expression),
      '[',
      field('index', $._expression),
      ']',
    )),

    member_expression: $ => prec(PREC.MEMBER, seq(
      field('object', $._expression),
      '.',
      field('property', $.identifier),
    )),

    // ---------- Literals ----------
    _literal: $ => choice(
      $.number_literal,
      $.string_literal,
      $.bool_literal,
      $.null_literal,
    ),

    array_literal: $ => seq(
      '[',
      commaSep($._array_element),
      ']',
    ),

    _array_element: $ => choice(
      $._expression,
      $.keyed_element,
    ),

    keyed_element: $ => seq(
      field('key', $.string_literal),
      ':',
      field('value', $._expression),
    ),

    number_literal: $ => /\d+(\.\d+)?/,

    bool_literal: $ => choice('true', 'false'),

    null_literal: $ => 'null',

    string_literal: $ => choice(
      seq('"', repeat(choice($.string_interpolation_part, $._string_content)), '"'),
      seq('`', repeat($._raw_string_content), '`'),
    ),

    _string_content: $ => token.immediate(/[^"{}\\]+|\\./),

    _raw_string_content: $ => token.immediate(/[^`]+/),

    string_interpolation_part: $ => seq(
      '{',
      $._expression,
      '}',
    ),

    string_interpolation: $ => prec(PREC.CALL, seq(
      field('template', $.string_literal),
    )),

    // ---------- Identifiers ----------
    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
  },
});

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
