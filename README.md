# tree-sitter-vivi


A **[Vivi](https://github.com/maidnaut/Vivi/blob/main/docs/spec.txt) grammar** for the
**[tree-sitter](https://github.com/tree-sitter/tree-sitter) parsing library**.

</div>

## Local setup

Install `tree-sitter-cli`:

```bash
cargo install tree-sitter-cli
```

To generate bindings:

```bash
tree-sitter generate
```

To run tests:

```bash
tree-sitter test
```

## Nvim highlighting
move `queries/highlights.scm` to `$HOME/.config/nvim/queries/vivi/highlights.scm`

nvim config
```lua
local parser_config = require 'nvim-treesitter.parsers'.get_parser_configs()
parser_config.vivi = {
  install_info = {
    url = "https://github.com/jkylander/tree-sitter-vivi",
    files = {"src/parser.c"},
    branch = "main",
  },
  filetype = "vivi"
}
vim.filetype.add({
  extension = {
    vivi = 'vivi',
  }
})
```
