var GrammarRegistry, cssGrammar, fs, jsGrammar, path, registry, tokenize, tokenizeFile;

path = require('path');

fs = require('@lumine-code/fs-plus');

GrammarRegistry = require('../src/grammar-registry');

registry = new GrammarRegistry();

jsGrammar = registry.loadGrammarSync(path.resolve(__dirname, '..', 'spec', 'fixtures', 'javascript.json'));

jsGrammar.maxTokensPerLine = 2e308;

cssGrammar = registry.loadGrammarSync(path.resolve(__dirname, '..', 'spec', 'fixtures', 'css.cson'));

cssGrammar.maxTokensPerLine = 2e308;

tokenize = function(grammar, content, lineCount) {
  var duration, i, len, start, tokenCount, tokenizedLine, tokenizedLines, tokensPerMillisecond;
  start = Date.now();
  tokenizedLines = grammar.tokenizeLines(content, false);
  duration = Date.now() - start;
  tokenCount = 0;
  for (i = 0, len = tokenizedLines.length; i < len; i++) {
    tokenizedLine = tokenizedLines[i];
    tokenCount += tokenizedLine.length;
  }
  tokensPerMillisecond = Math.round(tokenCount / duration);
  return console.log("Generated " + tokenCount + " tokens for " + lineCount + " lines in " + duration + "ms (" + tokensPerMillisecond + " tokens/ms)");
};

tokenizeFile = function(filePath, grammar, message) {
  var content, lineCount;
  console.log();
  console.log(message);
  content = fs.readFileSync(filePath, 'utf8');
  lineCount = content.split('\n').length;
  return tokenize(grammar, content, lineCount);
};

tokenizeFile(path.join(__dirname, 'large.js'), jsGrammar, 'Tokenizing jQuery v2.0.3');

tokenizeFile(path.join(__dirname, 'large.min.js'), jsGrammar, 'Tokenizing jQuery v2.0.3 minified');

tokenizeFile(path.join(__dirname, 'bootstrap.css'), cssGrammar, 'Tokenizing Bootstrap CSS v3.1.1');

tokenizeFile(path.join(__dirname, 'bootstrap.min.css'), cssGrammar, 'Tokenizing Bootstrap CSS v3.1.1 minified');
