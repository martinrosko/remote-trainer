var Resco;
(function (Resco) {
    function isINotifyPropertyChanged(obj) {
        // hack. chcek if obj has function propertyChanged, and that it has add, remove and raise methods ( -> assume it has event propertyChanged in that case)
        if ((typeof obj.propertyChanged === "object") && (typeof obj.propertyChanged.raise === "function") && (typeof obj.propertyChanged.add === "function") && (typeof obj.propertyChanged.remove === "function")) {
            return true;
        }
        return false;
    }
    Resco.isINotifyPropertyChanged = isINotifyPropertyChanged;
    var Size = (function () {
        function Size(w, h, keepNegative) {
            this.width = ko.observable(!keepNegative && w < 0 ? 0 : w);
            this.height = ko.observable(!keepNegative && h < 0 ? 0 : h);
        }
        return Size;
    }());
    Resco.Size = Size;
    var Position = (function () {
        function Position(l, t) {
            this.left = ko.observable(l);
            this.top = ko.observable(t);
        }
        return Position;
    }());
    Resco.Position = Position;
    var Location = (function () {
        function Location(lat, lon) {
            this.lat = lat;
            this.lon = lon;
        }
        return Location;
    }());
    Resco.Location = Location;
    var Rectangle = (function () {
        function Rectangle(l, t, w, h) {
            this.left = ko.observable(l);
            this.top = ko.observable(t);
            this.width = ko.observable(w);
            this.height = ko.observable(h);
        }
        return Rectangle;
    }());
    Resco.Rectangle = Rectangle;
    var ListCellKind;
    (function (ListCellKind) {
        ListCellKind[ListCellKind["Text"] = 0] = "Text";
        ListCellKind[ListCellKind["Image"] = 1] = "Image";
        ListCellKind[ListCellKind["Button"] = 2] = "Button";
        ListCellKind[ListCellKind["InlineButton"] = 3] = "InlineButton";
        ListCellKind[ListCellKind["Editable"] = 4096] = "Editable";
        ListCellKind[ListCellKind["Clickable"] = 8192] = "Clickable";
        ListCellKind[ListCellKind["DirectEdit"] = 20480] = "DirectEdit";
        ListCellKind[ListCellKind["ActionMask"] = 61440] = "ActionMask";
    })(ListCellKind = Resco.ListCellKind || (Resco.ListCellKind = {}));
    var ListCellAnchor;
    (function (ListCellAnchor) {
        ListCellAnchor[ListCellAnchor["None"] = 0] = "None";
        ListCellAnchor[ListCellAnchor["Top"] = 1] = "Top";
        ListCellAnchor[ListCellAnchor["Bottom"] = 2] = "Bottom";
        ListCellAnchor[ListCellAnchor["Left"] = 4] = "Left";
        ListCellAnchor[ListCellAnchor["Right"] = 8] = "Right";
    })(ListCellAnchor = Resco.ListCellAnchor || (Resco.ListCellAnchor = {}));
    var ListCellBorder;
    (function (ListCellBorder) {
        ListCellBorder[ListCellBorder["None"] = 0] = "None";
        ListCellBorder[ListCellBorder["Top"] = 1] = "Top";
        ListCellBorder[ListCellBorder["Bottom"] = 2] = "Bottom";
        ListCellBorder[ListCellBorder["Left"] = 4] = "Left";
        ListCellBorder[ListCellBorder["Right"] = 8] = "Right";
    })(ListCellBorder = Resco.ListCellBorder || (Resco.ListCellBorder = {}));
    var ContentAlignment;
    (function (ContentAlignment) {
        ContentAlignment[ContentAlignment["Near"] = 0] = "Near";
        ContentAlignment[ContentAlignment["Far"] = 1] = "Far";
        ContentAlignment[ContentAlignment["Center"] = 2] = "Center";
    })(ContentAlignment = Resco.ContentAlignment || (Resco.ContentAlignment = {}));
    var FontWeight;
    (function (FontWeight) {
        FontWeight[FontWeight["Regular"] = 0] = "Regular";
        FontWeight[FontWeight["Bold"] = 1] = "Bold";
        FontWeight[FontWeight["Italic"] = 2] = "Italic";
        FontWeight[FontWeight["Underline"] = 3] = "Underline";
        FontWeight[FontWeight["Strikeout"] = 4] = "Strikeout";
    })(FontWeight = Resco.FontWeight || (Resco.FontWeight = {}));
    var LabelPosition;
    (function (LabelPosition) {
        LabelPosition[LabelPosition["Left"] = 0] = "Left";
        LabelPosition[LabelPosition["Top"] = 1] = "Top";
        LabelPosition[LabelPosition["Right"] = 2] = "Right";
        LabelPosition[LabelPosition["Hidden"] = 3] = "Hidden";
    })(LabelPosition = Resco.LabelPosition || (Resco.LabelPosition = {}));
    function isIAsyncEnumerable(obj) {
        // hack. chcek if obj has function moveNextCompleted, queryCompleted and that it has add, remove and raise methods ( -> assume it has event moveNextCompleted, queryCompleted in that case)
        if (obj && (typeof obj.moveNextCompleted === "object") && (typeof obj.moveNextCompleted.raise === "function") && (typeof obj.moveNextCompleted.add === "function") && (typeof obj.moveNextCompleted.remove === "function") &&
            (typeof obj.queryCompleted === "object") && (typeof obj.queryCompleted.raise === "function") && (typeof obj.queryCompleted.add === "function") && (typeof obj.queryCompleted.remove === "function")) {
            return true;
        }
        return false;
    }
    Resco.isIAsyncEnumerable = isIAsyncEnumerable;
    function hasFunction(obj, fname) {
        if (obj && (typeof obj[fname] === "function")) {
            return true;
        }
        return false;
    }
    Resco.hasFunction = hasFunction;
    function isIComparable(obj) {
        return hasFunction(obj, "compareTo");
    }
    Resco.isIComparable = isIComparable;
    var KeyValuePair = (function () {
        function KeyValuePair(k, v) {
            this.key = k;
            this.value = v;
        }
        return KeyValuePair;
    }());
    Resco.KeyValuePair = KeyValuePair;
    var Dictionary = (function () {
        function Dictionary() {
            this.m_list = new Array();
        }
        Dictionary.prototype.getEnumerator = function () {
            var enumer = {};
            enumer["list"] = this.m_list;
            enumer["position"] = -1;
            enumer["moveNext"] = function () {
                if (enumer["position"]++ < enumer["list"].length - 1) {
                    enumer["current"] = enumer["list"][enumer["position"]];
                    return true;
                }
                enumer["current"] = null;
                return false;
            };
            enumer["current"] = null;
            enumer["reset"] = function () {
                enumer["position"] = -1;
            };
            return enumer;
        };
        Dictionary.prototype.indexOfKey = function (key) {
            for (var i = 0; i < this.m_list.length; i++) {
                if (this.m_list[i].key === key) {
                    return i;
                }
            }
            return -1;
        };
        Object.defineProperty(Dictionary.prototype, "length", {
            get: function () {
                return this.m_list.length;
            },
            enumerable: true,
            configurable: true
        });
        Dictionary.prototype.containsKey = function (key) {
            return this.indexOfKey(key) >= 0;
        };
        Dictionary.prototype.getValue = function (key) {
            var index = this.indexOfKey(key);
            return (index >= 0) ? this.m_list[index].value : undefined;
        };
        Dictionary.prototype.getValues = function () {
            return this.m_list.map(function (kv) { return kv.value; });
        };
        Dictionary.prototype.getIndex = function (index) {
            return this.m_list[index].value;
        };
        Dictionary.prototype.getKeys = function () {
            return this.m_list.map(function (kv) { return kv.key; });
        };
        Dictionary.prototype.add = function (key, value) {
            if (this.containsKey(key)) {
                throw new Resco.Exception("Dictionary already contains passed Key");
            }
            this.m_list.push(new KeyValuePair(key, value));
        };
        Dictionary.prototype.set = function (key, value) {
            var index = this.indexOfKey(key);
            if (index >= 0) {
                this.m_list[index] = new KeyValuePair(key, value);
            }
            else {
                this.m_list.push(new KeyValuePair(key, value));
            }
        };
        Dictionary.prototype.remove = function (key) {
            var index = this.indexOfKey(key);
            if (index >= 0) {
                this.m_list.splice(index, 1);
                return true;
            }
            return false;
        };
        Dictionary.prototype.clear = function () {
            this.m_list.splice(0, this.m_list.length);
        };
        Dictionary.prototype.firstOrDefault = function (predicate, def) {
            for (var i = 0; i < this.m_list.length; i++) {
                var value = this.m_list[i].value;
                if (predicate(value)) {
                    return value;
                }
            }
            return def;
        };
        Dictionary.prototype.forEach = function (fn, caller) {
            if (fn) {
                this.m_list.forEach(function (kv) { return caller ? fn.call(caller, kv) : fn(kv); });
            }
        };
        return Dictionary;
    }());
    Resco.Dictionary = Dictionary;
    var TextReader = (function () {
        function TextReader(lines) {
            this.m_lines = lines;
            this.m_position = 0;
        }
        TextReader.prototype.close = function () {
            this.m_lines = null;
            this.m_position = -1;
        };
        TextReader.prototype.readLine = function () {
            if (this.m_lines && this.m_position <= this.m_lines.length) {
                return this.m_lines[this.m_position++];
            }
            return null;
        };
        TextReader.prototype.getLines = function (from, to) {
            return this.m_lines.slice(from, to);
        };
        TextReader.prototype.readToEnd = function () {
            if (this.m_lines) {
                return this.m_lines.join("\r\n");
            }
            return "";
        };
        return TextReader;
    }());
    Resco.TextReader = TextReader;
    // there might be a problem in Math.random() browseer implementation quality
    function createGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    Resco.createGuid = createGuid;
    function asString(value) {
        if (typeof value == typeof "") {
            return value;
        }
        return null;
    }
    Resco.asString = asString;
    function toString(value) {
        if (value && value.toString && typeof value.toString === "function") {
            return value.toString();
        }
        return "";
    }
    Resco.toString = toString;
    function strictParseFloat(value) {
        if (/^(\-|\+)?([0-9]+(\.[0-9]+)?)$/.test(value)) {
            return Number(value);
        }
        return NaN;
    }
    Resco.strictParseFloat = strictParseFloat;
    function strictParseInt(value) {
        if (/^(\-|\+)?([0-9]+)$/.test(value)) {
            return Number(value);
        }
        return NaN;
    }
    Resco.strictParseInt = strictParseInt;
    function notNull(v) {
        return !(v === null || v === undefined);
    }
    Resco.notNull = notNull;
    function formatString(fmt, params) {
        var result = "";
        var lastIndex = 0;
        var sBracIndex = fmt.indexOf('{', lastIndex);
        while (sBracIndex >= 0 && sBracIndex < fmt.length - 1) {
            if (fmt[sBracIndex + 1] == '{') {
                sBracIndex = fmt.indexOf('{', sBracIndex + 2);
                continue;
            }
            var eBracIndex = fmt.indexOf('}', sBracIndex + 1);
            if (eBracIndex <= 0 || sBracIndex + 1 == eBracIndex) {
                return fmt; // fmt is not valid format string, do not format it
            }
            var formatting = fmt.substring(sBracIndex + 1, eBracIndex);
            var formattingParts = formatting.split(':');
            var paramIndex = strictParseInt(formattingParts[0]);
            var decimalPlaces = 0;
            if (isNaN(paramIndex) || paramIndex < 0 || paramIndex > params.length - 1) {
                return fmt;
            }
            if (formattingParts.length > 1) {
                decimalPlaces = strictParseInt(formattingParts[1].substring(1));
            }
            var param = params[paramIndex];
            if (decimalPlaces >= 0) {
                var numParam = strictParseFloat(param);
                if (!isNaN(numParam)) {
                    param = round10(numParam, -decimalPlaces);
                    var paramDecimalPlaces = Resco.decimalPlaces(param);
                    if (paramDecimalPlaces < decimalPlaces) {
                        param = param + (paramDecimalPlaces > 0 ? "" : ".") + new Array(decimalPlaces - paramDecimalPlaces + 1).join("0");
                    }
                }
            }
            if (Resco.hasFunction(param, "toString")) {
                param = param.toString();
            }
            result += fmt.substring(lastIndex, sBracIndex); // append characcters betwwen } {
            result += param;
            lastIndex = eBracIndex + 1;
            sBracIndex = fmt.indexOf('{', lastIndex);
        }
        result += fmt.substring(lastIndex);
        return result;
    }
    Resco.formatString = formatString;
    function round10(value, exp) {
        // If the exp is undefined or zero...
        if (typeof exp === 'undefined' || +exp === 0) {
            return Math.round(value);
        }
        value = +value;
        exp = +exp;
        // If the value is not a number or the exp is not an integer...
        if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
            return NaN;
        }
        // Shift
        value = value.toString().split('e');
        value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
        // Shift back
        value = value.toString().split('e');
        return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
    }
    Resco.round10 = round10;
    function decimalPlaces(num) {
        var match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
        if (!match) {
            return 0;
        }
        return Math.max(0, 
        // Number of digits right of decimal point.
        (match[1] ? match[1].length : 0)
            - (match[2] ? +match[2] : 0));
    }
    Resco.decimalPlaces = decimalPlaces;
    function showNotification(title, body, data, callback, callbackSource, icon) {
        //if ("Notification" in window) {
        //    if (title && title.length > 40) {
        //        title = title.substr(0, 40) + "...";
        //    }
        //    if (body && body.length > 40) {
        //        body = body.substr(0, 40) + "...";
        //    }
        //    // Let's check whether notification permissions have already been granted
        //    if (Notification.permission === "granted") {
        //        var notification = _createNotification(title, body, data, icon);
        //        notification.onclick = (o) => {
        //            if (callback) {
        //                callback.call(callbackSource ? callbackSource : this, o);
        //            }
        //        }
        //    }
        //    else if (Notification.permission !== 'denied') {
        //        Notification.requestPermission(function (permission) {
        //            if (permission === "granted") {
        //                var notification = _createNotification(title, body, data, icon);
        //                notification.onclick = (o) => {
        //                    if (callback) {
        //                        callback.call(callbackSource ? callbackSource : this, o);
        //                    }
        //                }
        //            }
        //        });
        //    }
        //}
    }
    Resco.showNotification = showNotification;
    function _createNotification(title, body, data, icon) {
        var options = {
            body: body,
            icon: icon,
            data: data
        };
        return new Notification(title, options);
    }
})(Resco || (Resco = {}));
String.prototype.hashCode = function () {
    var hash = 0, i, chr, len;
    if (this.length == 0)
        return hash;
    for (i = 0, len = this.length; i < len; i++) {
        chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};
String.prototype.startsWith = function (prefix) {
    if (this) {
        if (prefix.length <= this.length) {
            return (this.substr(0, prefix.length) === prefix);
        }
    }
    return false;
};
String.prototype.endsWith = function (sufix) {
    if (this) {
        var lastIndex = this.lastIndexOf(sufix);
        return lastIndex >= 0 && (lastIndex + sufix.length) == this.length;
    }
    return false;
};
String.prototype.indexOfAny = function () {
    var chars = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        chars[_i] = arguments[_i];
    }
    var result = -1;
    if (this) {
        for (var i = 0; i < chars.length; i++) {
            var index = this.indexOf(chars[i]);
            if (index >= 0 && (index < result || result == -1)) {
                result = index;
            }
        }
    }
    return result;
};
String.prototype.encodeXML = function () {
    return this.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};
String.prototype.decodeXML = function () {
    return this.replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&');
};
String.prototype.makePathFromDottedNotation = function () {
    var index = this.lastIndexOf(".");
    if (index >= 0) {
        var ext = this.substr(index);
        var path = this.substr(0, index);
        return path.replace(".", "\\") + ext;
    }
    return this;
};
String.prototype.toBase64 = function () {
    return btoa(encodeURIComponent(this).replace(/%([0-9A-F]{2})/g, function (match, p1) {
        return String.fromCharCode(+('0x' + p1));
    }));
};
String.prototype.fromBase64ToBlob = function () {
    var decB64 = atob(this);
    var ab = new ArrayBuffer(decB64.length);
    var ua = new Uint8Array(ab);
    for (var i = 0; i < decB64.length; i++) {
        ua[i] = decB64.charCodeAt(i);
    }
    return new Blob([ab]);
};
String.prototype.fromBase64 = function () {
    var decB64 = atob(this);
    var decURI = "";
    for (var i = 0; i < decB64.length; i++) {
        var c = decB64.charCodeAt(i).toString(16);
        decURI += ((c.length == 1 ? "%0" : "%") + c);
        if (c.length > 2) {
            var i = 0;
        }
    }
    return decodeURIComponent(decURI);
};
String.prototype.toUrlSafeBase64 = function (skipEncode) {
    var data = this;
    if (!skipEncode) {
        data = this.toBase64();
    }
    return data.replace(/\+/g, '-').replace(/\//g, '_');
};
String.prototype.fromUrlSafeBase64 = function (skipDecode) {
    var dec = this.replace(/-/g, "+").replace(/_/g, "/");
    return skipDecode ? dec : dec.fromBase64();
};
String.prototype.stripLastColon = function () {
    var data = this;
    if (data[data.length - 1] == ",") {
        data = data.substring(0, data.length - 1);
    }
    return data;
};
String.prototype.stringifyText = function (encloseIn, escapeSingleQuote, escapeDoubleQuote) {
    if (escapeSingleQuote === void 0) { escapeSingleQuote = true; }
    if (escapeDoubleQuote === void 0) { escapeDoubleQuote = true; }
    var data = this;
    if (encloseIn === "\"") {
        escapeDoubleQuote = true;
    }
    else if (encloseIn === "'") {
        escapeSingleQuote = true;
    }
    else {
        throw new Resco.ArgumentException("Invalid parameter 'encloseIn'");
    }
    var result = encloseIn;
    var quoteVal = escapeDoubleQuote ? '\\"' : '"';
    var aposVal = escapeSingleQuote ? "\\'" : "'";
    for (var i = 0; i < data.length; i++) {
        var c = data[i];
        var escapedValue;
        switch (c) {
            case '"':
                escapedValue = quoteVal;
                break;
            case '\'':
                escapedValue = aposVal;
                break;
            case '\t':
                escapedValue = '\\\t';
                break;
            case '\n':
                escapedValue = '\\\n';
                break;
            case '\r':
                escapedValue = '\\\r';
                break;
            case '\f':
                escapedValue = '\\\f';
                break;
            case '\b':
                escapedValue = '\\\b';
                break;
            case '\\':
                escapedValue = '\\\\';
                break;
            case '\u0085':
                escapedValue = '\\u0085';
                break;
            case '\u2028':
                escapedValue = '\\u2028';
                break;
            case '\u2029':
                escapedValue = '\\u2029';
                break;
            default: escapedValue = c;
        }
        result += escapedValue;
    }
    return result + encloseIn;
};
String.prototype.firstCharToLower = function () {
    return this && this.length > 0 ? this[0].toLowerCase() + this.substr(1) : this;
};
Number.prototype.hashCode = function () {
    var d = this;
    if (!d) {
        return 0;
    }
    return d; // just return the number
};
Number.prototype.compareTo = function (o) {
    if ((typeof o === "number") || (typeof o === "string")) {
        var n = +o;
        if (!isNaN(n))
            return this - n;
    }
    return -1;
};
Array.prototype.firstOrDefault = function (callbackfn, def) {
    var filter = callbackfn ? this.filter(callbackfn) : this;
    if (filter.length > 0) {
        return filter[0];
    }
    return def;
};
Array.prototype.contains = function (item) {
    var filter = this.filter(function (f) { return f === item; });
    return filter.length > 0;
};
Date.prototype.toJSBridge = function () {
    var d = this;
    return Resco.formatString("new Date({0},{1},{2},{3},{4},{5},{6})", [d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()]);
};
Date.prototype.compareTo = function (o) {
    if (o instanceof Date) {
        return this.getTime() - o.getTime();
    }
    return -1;
};
//# sourceMappingURL=common.js.map