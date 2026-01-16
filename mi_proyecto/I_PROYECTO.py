
import re, html, ast, traceback
from dataclasses import dataclass
from typing import List
import pandas as pd
from graphviz import Digraph
import gradio as gr
from pygments import highlight
from pygments.lexers import PythonLexer as PygmentsPythonLexer
from pygments.formatters import HtmlFormatter

# -------------------------
# 1) ANALIZADOR LÉXICO
# -------------------------
@dataclass
class Token:
    tipo: str
    valor: str
    linea: int
    columna: int

class LexerError(Exception):
    pass

class PythonLexer:
    def __init__(self):
        self.keywords = {
            'False','None','True','and','as','assert','break','class','continue',
            'def','del','elif','else','except','finally','for','from','global',
            'if','import','in','is','lambda','nonlocal','not','or','pass',
            'raise','return','try','while','with','yield'
        }
        self.aritmeticos = {"+","-","*","/","%","//","**"}
        self.relacionales = {"==","!=","<",">","<=",">="}
        self.logicos = {"and","or","not"}
        self.asignacion_ops = {"=","+=","-=","*=","/=","%=","//=","**=","&=","|=","^=","<<=",">>="}
        self.bitwise = {"&","|","^","~","<<",">>"}

        token_specification = [
            ('TRIPLE_STRING', r'("""[\s\S]*?"""|\'\'\'[\s\S]*?\'\'\')'),
            ('STRING',        r'(\"([^"\\]|\\.)*\"|\'([^\'\\]|\\.)*\')'),
            ('COMMENT',       r'\#.*'),
            ('NUMBER',        r'0[xX][0-9a-fA-F]+|0[oO][0-7]+|0[bB][01]+|\d+(\.\d+)?([eE][+-]?\d+)?'),
            ('ID',            r'[A-Za-z_]\w*'),
            ('OP',            r'==|!=|<=|>=|\+=|-=|\*=|/=|%=|\*\*=|//=|<<=|>>=|->|//|\*\*|<<|>>|[-+*/%<>=&\|\^~]'),
            ('DELIM',         r'[()\[\]{}]'),
            ('SEP',           r'[:,.;]'),
            ('NEWLINE',       r'\n'),
            ('SKIP',          r'[ \t\r\f]+'),
            ('MISMATCH',      r'.'),
        ]
        self.tok_regex = re.compile('|'.join(f'(?P<{name}>{pattern})' for name, pattern in token_specification))

    def classify_op(self, val):
        if val in self.aritmeticos:
            return "Operador aritmético"
        if val in self.relacionales:
            return "Operador relacional"
        if val in self.bitwise:
            return "Operador bit a bit"
        if val in self.asignacion_ops:
            return "Operador de asignación"
        if val in self.logicos:
            return "Operador lógico"
        return "Operador"

    def tokenize(self, code: str) -> List[Token]:
        tokens = []
        line_num = 1
        line_start = 0
        for mo in self.tok_regex.finditer(code):
            kind = mo.lastgroup
            value = mo.group(kind)
            column = mo.start() - line_start + 1
            if kind == 'NUMBER':
                tokens.append(Token("Literal numérico", value, line_num, column))
            elif kind in ('TRIPLE_STRING','STRING'):
                tokens.append(Token("Literal cadena", value, line_num, column))
            elif kind == 'ID':
                if value in self.keywords:
                    if value in {'True','False'}:
                        tokens.append(Token("Literal booleano", value, line_num, column))
                    elif value == 'None':
                        tokens.append(Token("Literal nulo", value, line_num, column))
                    elif value in self.logicos:
                        tokens.append(Token("Operador lógico", value, line_num, column))
                    else:
                        tokens.append(Token("Palabra clave", value, line_num, column))
                else:
                    tokens.append(Token("Identificador", value, line_num, column))
            elif kind == 'OP':
                tokens.append(Token(self.classify_op(value), value, line_num, column))
            elif kind == 'DELIM':
                tokens.append(Token("Delimitador", value, line_num, column))
            elif kind == 'SEP':
                tokens.append(Token("Separador", value, line_num, column))
            elif kind == 'COMMENT':
                tokens.append(Token("Comentario línea", value, line_num, column))
            elif kind == 'NEWLINE':
                line_num += 1
                line_start = mo.end()
            elif kind == 'SKIP':
                continue
            elif kind == 'MISMATCH':
                raise LexerError(f"Caracter inesperado {value!r} en línea {line_num} columna {column}")
        return tokens

# -------------------------
# 2) ANÁLISIS SINTÁCTICO: árbol sintáctico limpio
# -------------------------
_IGNORED_AST_CLASSES = (
    ast.Load, ast.Store, ast.Del, ast.AugLoad, ast.AugStore, ast.Param,
    ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Mod, ast.Pow, ast.FloorDiv,
    ast.Eq, ast.NotEq, ast.Lt, ast.LtE, ast.Gt, ast.GtE,
    ast.And, ast.Or, ast.Not, ast.arguments, ast.arg, ast.keyword, ast.Tuple
)

def is_ignorable(node):
    return isinstance(node, _IGNORED_AST_CLASSES)

def syntax_tree(ast_node):
    g = Digraph(format='svg')
    g.attr('node', shape='ellipse', fontname='Helvetica', style='filled', fillcolor='#e6f7ff')
    counter = {'i':0}

    op_map =  {
        ast.Add: "+", ast.Sub: "-", ast.Mult: "*", ast.Div: "/",
        ast.Mod: "%", ast.Pow: "**", ast.FloorDiv: "//",
        ast.Eq: "==", ast.NotEq: "!=", ast.Lt: "<", ast.LtE: "<=",
        ast.Gt: ">", ast.GtE: ">=", ast.And: "and", ast.Or: "or", ast.Not: "not"
    }

    def label_of(node):
        if isinstance(node, ast.BinOp):
            return op_map.get(type(node.op), "?")
        if isinstance(node, ast.UnaryOp):
            return op_map.get(type(node.op), "?")
        if isinstance(node, ast.Compare):
            if node.ops:
                return op_map.get(type(node.ops[0]), "?")
        if isinstance(node, ast.Assign):
            return "="
        if isinstance(node, ast.Name):
            return node.id
        if isinstance(node, ast.Constant):
            return repr(node.value)
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                return f"{node.func.id}()"
            return "call()"
        if isinstance(node, ast.FunctionDef):
            return f"def {node.name}()"
        if isinstance(node, ast.ClassDef):
            return f"class {node.name}()"
        if isinstance(node, ast.For):
            return "for"
        if isinstance(node, ast.While):
            return "while"
        if isinstance(node, ast.If):
            return "if"
        return node.__class__.__name__

    def add(node, parent=None):
        if is_ignorable(node):
            for ch in ast.iter_child_nodes(node):
                add(ch, parent)
            return None
        nid = f"n{counter['i']}"
        counter['i'] += 1
        g.node(nid, label_of(node))
        if parent:
            g.edge(parent, nid)
        for child in ast.iter_child_nodes(node):
            add(child, nid)
        return nid

    add(ast_node, None)
    return g.pipe().decode('utf-8')

# -------------------------
# 3) ANÁLISIS SEMÁNTICO
# -------------------------
class SemanticAnalyzer(ast.NodeVisitor):
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.scopes = [set()]   # global scope
        self.functions = set()
        self.builtins = set(dir(__builtins__))

    def current_scope(self):
        return self.scopes[-1]

    def push_scope(self):
        self.scopes.append(set())

    def pop_scope(self):
        self.scopes.pop()

    def add_var(self, name):
        self.current_scope().add(name)

    def is_defined(self, name):
        for s in reversed(self.scopes):
            if name in s:
                return True
        if name in self.functions:
            return True
        if name in self.builtins:
            return True
        return False

    def visit_Assign(self, node):
        for t in node.targets:
            if isinstance(t, ast.Name):
                self.add_var(t.id)
        self.generic_visit(node)

    def visit_FunctionDef(self, node):
        self.functions.add(node.name)
        self.push_scope()
        for arg in node.args.args:
            self.add_var(arg.arg)
        for n in node.body:
            self.visit(n)
        self.pop_scope()

    def visit_Name(self, node):
        if isinstance(node.ctx, ast.Load):
            if not self.is_defined(node.id):
                self.errors.append(f"Variable '{node.id}' usada sin definir (línea {getattr(node,'lineno','?')})")
        self.generic_visit(node)

    def visit_BinOp(self, node):
        left, right = node.left, node.right
        if isinstance(left, ast.Constant) and isinstance(right, ast.Constant):
            try:
                opfunc = {
                    ast.Add: lambda a,b: a+b,
                    ast.Sub: lambda a,b: a-b,
                    ast.Mult: lambda a,b: a*b,
                    ast.Div: lambda a,b: a/b
                }.get(type(node.op))
                if opfunc:
                    try:
                        opfunc(left.value, right.value)
                    except TypeError:
                        self.errors.append(f"Operación inválida entre literales ({type(left.value).__name__} y {type(right.value).__name__}) en línea {node.lineno}")
                    except ZeroDivisionError:
                        self.errors.append(f"División por cero en línea {node.lineno}")
            except Exception:
                pass
        self.generic_visit(node)

    def visit_Call(self, node):
        if isinstance(node.func, ast.Name):
            fname = node.func.id
            if fname not in self.functions and fname not in self.builtins:
                self.warnings.append(f"Llamada a función posiblemente no definida: '{fname}' (línea {node.lineno})")
        self.generic_visit(node)

# -------------------------
# 4) INTEGRACIÓN
# -------------------------
def analyze_code(code: str):
    lexer = PythonLexer()
    try:
        tokens = lexer.tokenize(code)
        df = pd.DataFrame([{"Línea": t.linea, "Columna": t.columna, "Tipo": t.tipo, "Valor": html.escape(t.valor)} for t in tokens])
        tokens_html = df.to_html(index=False, escape=False)
        lexer_err = ""
    except LexerError as e:
        tokens_html = ""
        lexer_err = str(e)
        df = pd.DataFrame()

    try:
        tree = ast.parse(code)
        syn_svg = syntax_tree(tree)
        parse_err = ""
    except Exception as e:
        syn_svg = ""
        parse_err = traceback.format_exc()

    sem_html = ""
    if parse_err == "":
        analyzer = SemanticAnalyzer()
        try:
            analyzer.visit(tree)
            messages = []
            for e in analyzer.errors:
                messages.append(("Error", e))
            for w in analyzer.warnings:
                messages.append(("Warning", w))
            if not messages:
                messages = [("OK", "No se encontraron errores semánticos")]
            sem_html = "<table style='width:100%; border-collapse:collapse'>"
            sem_html += "<tr><th style='background:#1976D2;color:white;padding:6px;text-align:left'>Tipo</th><th style='background:#1976D2;color:white;padding:6px;text-align:left'>Mensaje</th></tr>"
            for t,m in messages:
                color = "#cc0000" if t=="Error" else ("#ff9800" if t=="Warning" else "#2e7d32")
                sem_html += f"<tr><td style='padding:6px'>{t}</td><td style='padding:6px;color:{color};font-weight:bold'>{html.escape(m)}</td></tr>"
            sem_html += "</table>"
        except Exception as e:
            sem_html = f"<p style='color:red'>Error en análisis semántico: {e}</p>"
    else:
        sem_html = f"<p style='color:red'>No se ejecutó: error sintáctico</p>"

    try:
        formatter = HtmlFormatter(full=True, nowrap=False)
        highlighted = highlight(code, PygmentsPythonLexer(), formatter)
    except Exception:
        highlighted = "<pre>"+html.escape(code)+"</pre>"

    return tokens_html, lexer_err, syn_svg, parse_err, sem_html, highlighted

# -------------------------
# 5) INTERFAZ GRADIO
# -------------------------
TITLE_HTML = "<h1 style='color:#0D47A1; font-weight:800; font-size:36px; margin-bottom:4px'>Mini-Compilador Python</h1>"
SUB_HTML = "<p style='color:#37474F; font-size:14px; margin-top:0'>Léxico • Sintáctico • Semántico — pega <b>cualquier código</b> Python y obtén tabla de tokens, árbol y chequeos semánticos.</p>"

examples = {
    "Asignación y aritmética": "posicion = inicial + velocidad * 60\nvelocidad = 5\ninicial = 10",
    "Funciones y llamadas": "def saludar(nombre):\n    mensaje = 'Hola '+ nombre\n    print(mensaje)\n\nsaludar('Mundo')",
    "Errores semánticos": "a = 'hola' + 3\nb = a / 0\nprint(x)",
    "If y bucles": "i = 0\nwhile i < 3:\n    print(i)\n    i += 1\nfor j in range(2):\n    print(j)"
}

with gr.Blocks(theme=gr.themes.Soft()) as demo:
    gr.HTML(TITLE_HTML)
    gr.HTML(SUB_HTML)
    with gr.Row():
        with gr.Column(scale=2):
            code_in = gr.Textbox(label="Código Python", lines=18, value=examples["Asignación y aritmética"])
            with gr.Row():
                analyze_btn = gr.Button("🔍 Analizar", variant="primary")
                example_dd = gr.Dropdown(list(examples.keys()), value="Asignación y aritmética", label="Ejemplos rápidos")
                load_example = gr.Button("Cargar ejemplo")
        with gr.Column(scale=1):
            gr.Markdown("**Vista de código (resaltado)**")
            highlighted_out = gr.HTML()
            gr.Markdown("**Instrucciones rápidas**")
            gr.HTML("<ul><li>Pega cualquier código Python válido.</li><li>Si hay error sintáctico, el árbol no se generará; verás el error.</li><li>Semántica: variables sin definir, división por cero literal y llamadas no definidas.</li></ul>")

    with gr.Tabs():
        with gr.TabItem("Análisis Léxico"):
            gr.Markdown("### Tabla de tokens")
            tokens_out = gr.HTML()
            lexer_error_out = gr.Textbox(label="Errores léxicos", interactive=False)
        with gr.TabItem("Análisis Sintáctico"):
            gr.Markdown("### Árbol sintáctico (compacto, símbolos reales)")
            syntax_out = gr.HTML()
            syntax_error_out = gr.Textbox(label="Errores sintácticos", interactive=False)
        with gr.TabItem("Análisis Semántico"):
            gr.Markdown("### Resultados del análisis semántico")
            sem_out = gr.HTML()

    def load_example_fn(key):
        return examples[key]

    def on_analyze(code):
        toks_html, lex_err, syn_svg, syn_err, sem_html, highlighted = analyze_code(code)
        if toks_html == "":
            toks_html = f"<p style='color:red'>Error léxico: {html.escape(lex_err)}</p>"
        syn_html = syn_svg if syn_svg else f"<p style='color:red'>No se generó árbol (error sintáctico)</p>"
        return toks_html, lex_err, syn_html, syn_err, sem_html, highlighted

    analyze_btn.click(on_analyze, inputs=[code_in], outputs=[tokens_out, lexer_error_out, syntax_out, syntax_error_out, sem_out, highlighted_out])
    load_example.click(lambda k: examples[k], inputs=[example_dd], outputs=[code_in])

demo.launch(share=True)
