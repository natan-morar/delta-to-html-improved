var equal = require("fast-deep-equal");

var escapeHtml = function(unsafe) {
  if (unsafe) {
  }
  return unsafe.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

var wrapTag = function(tag, value, attrs) {
  return "<" + tag + attrsToString(attrs) + ">" + value + "</" + tag + ">";
};

var singleTag = function(tag, attrs) {
  return "<" + tag + attrsToString(attrs) + ">";
};

var attrsToString = function(attrs) {
  var attr_string = "";
  if (attrs) {
    for (var item in attrs) {
      attr_string += " " + item + "='" + attrs[item] + "'";
    }
  }
  return attr_string;
};

var convert = function(value, attributes) {
  let qclass = "";
  if (attributes) {
    if (attributes["align"]) {
      if (attributes["align"] == "center") qclass += "ql-align-center ";
      if (attributes["align"] == "left") qclass += "ql-align-left ";
      if (attributes["align"] == "right") qclass += "ql-align-right ";
      if (attributes["align"] == "justify") qclass += "ql-align-justify ";
    }
    if (attributes["indent"]) {
      qclass += `ql-indent-${attributes["indent"]} `;
    }
    if (attributes["code-block"]) {
      return wrapTag("pre", wrapTag("code", value.join("\n").trim()), {
        class: qclass
      });
    } else if (attributes["header"]) {
      return wrapTag("h" + attributes["header"], value, {
        class: qclass
      });
    } else if (attributes["blockquote"]) {
      return wrapTag("blockquote", /* value.join("\n").trim() */ value, {
        class: qclass
      });
    } else if (attributes["list"]) {
      return wrapTag(
        attributes["list"] == "ordered" ? "ol" : "ul",
        value
          .map(function(item) {
            return wrapTag("li", item);
          })
          .join(""),
        { class: qclass }
      );
    } else {
      //console.log(value, attributes);
    }
  }

  return wrapTag("p", value, { class: qclass });
};

var convertInline = function(insert, attributes) {
  let qstyle = "";
  let qclass = "";
  if (attributes) {
    // if (attributes["color"]) {
    //   qstyle += `color:${attributes["color"]};`;
    // }
    // if (attributes["background"]) {
    //   qstyle += `background:${attributes["background"]};`;
    // }

    if (attributes["font"]) {
      if (attributes["font"] == "serif") qclass += "ql-font-serif ";
      if (attributes["font"] == "monospace") qclass += "ql-font-monospace ";
    }

    html = insert;
    let once = {
      italic: false,
      underline: false,
      bold: false,
      link: false,
      code: false,
      strike: false,
      script: false
    };
    for (var key in attributes) {
      if (key == "italic" && once.italic == false) {
        html = wrapTag("em", html, { class: qclass /*, style:qstyle */ });
        once.italic = true;
      } else if (key == "underline" && once.underline == false) {
        html = wrapTag("u", html, { class: qclass });
        once.underline = true;
      } else if (attributes["bold"] && once.bold == false) {
        html = wrapTag("b", html, { class: qclass });
        once.bold = true;
      } else if (attributes["link"] && once.link == false) {
        html = wrapTag("a", html, {
          href: attributes.link,
          target: "_blank",
          class: qclass
        });
        once.link = true;
      } else if (attributes["code"] && once.code == false) {
        html = wrapTag("code", html, { class: qclass });
        once.code = true;
      } else if (attributes["strike"] && once.strike == false) {
        once.strike = true;
        html = wrapTag("s", html, { class: qclass });
      } else if (attributes["script"] && once.script == false) {
        if (attributes["script"] == "super")
          html = wrapTag("sup", html, {
            class: qclass
          });
        if (attributes["script"] == "sub")
          html = wrapTag("sub", html, {
            class: qclass
          });
        once.script = true;
      }
    }
    return html;
  }

  return insert;
};

var DeltaConverter = function(delta) {
  this.results = "";
  this.current = {
    value: "",
    attributes: null
  };
  this.delta = delta;
};

DeltaConverter.prototype.addItem = function(insert, attributes) {
  if (typeof insert === "string" || insert instanceof String) {
    if (insert.indexOf("\n") >= 0) {
      if (
        equal(this.current.attributes, attributes) &&
        attributes &&
        (attributes["code-block"] ||
          attributes["list"]) /*  ||
          attributes["blockquote"] */ &&
        insert == "\n"
      ) {
      } else {
        this.convertPrevious();
        this.current.attributes = attributes;
      }
    }

    this.current.value += convertInline(escapeHtml(insert), attributes);
  } else if (typeof insert == "object") {
    if (insert.image) {
      this.current.value += singleTag("img", {
        src: insert.image,
        width: attributes && attributes.width ? attributes.width : "auto",
        height: attributes && attributes.height ? attributes.height : "auto",
        class:
          attributes && attributes.align ? `ql-align-${attributes.align}` : ""
      });
    } else if (insert.video) {
      this.current.value += wrapTag("iframe", "", {
        src: insert.video,
        width: attributes && attributes.width ? attributes.width : "auto",
        height: attributes && attributes.height ? attributes.height : "auto",
        class:
          attributes && attributes.align ? `ql-align-${attributes.align}` : ""
      });
    }
  }
};

DeltaConverter.prototype.convertPrevious = function() {
  if (this.current.value.indexOf("\n") >= 0) {
    var values = this.current.value.split("\n"),
      length = values.length;

    if (
      this.current.attributes &&
      (this.current.attributes["code-block"] ||
        this.current.attributes[
          "list"
        ]) /* ||
        this.current.attributes["blockquote"] */
    ) {
      var blockValues = [];
      for (var i = 0; i < length - 1; i++) {
        blockValues.push(values[i]);
      }
      this.results += convert(blockValues, this.current.attributes);
    } else {
      for (var i = 0; i < length - 1; i++) {
        this.results += convert(values[i], this.current.attributes);
      }
    }
    this.current.value = values[length - 1];
  }
};

DeltaConverter.prototype.convertRemain = function() {
  if (this.current.value.indexOf("\n") >= 0) {
    var values = this.current.value.split("\n"),
      length = values.length,
      results = "";
    if (
      this.current.attributes &&
      (this.current.attributes["code-block"] ||
        this.current.attributes[
          "list"
        ]) /* ||
        this.current.attributes["blockquote"] */
    ) {
      var blockValues = [];
      for (var i = 0; i < length; i++) {
        blockValues.push(values[i]);
      }
      results += convert(blockValues, this.current.attributes);
    } else {
      for (var i = 0; i < length; i++) {
        if (i == length - 1 && !values[i]) {
          break;
        }
        results += convert(values[i], this.current.attributes);
      }
    }
    return results;
  } else {
    return convert(this.current.value, this.current.attributes);
  }
};

DeltaConverter.prototype.toHtml = function() {
  var ops = this.delta.ops,
    length = ops.length;

  for (var i = 0; i < length; i++) {
    var insert = ops[i].insert,
      attributes = ops[i].attributes;

    this.addItem(insert, attributes);
  }

  this.results += this.convertRemain();

  //// replace functions
  function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  }
  function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
  }
  // replace empty paragraphs with '&nbsp;'
  this.results = replaceAll(this.results, "></p>", "><br/></p>");
  this.results = replaceAll(this.results, "></h2>", "><br/></h2>");
  this.results = replaceAll(this.results, "></h3>", "><br/></h3>");
  this.results = replaceAll(this.results, "class=''", "");

  return this.results;
};

module.exports = DeltaConverter;
