module Resco {
    export interface INotifyPropertyChanged {
        propertyChanged: Resco.Event<Resco.PropertyChangedEventArgs>;
    }

    export function isINotifyPropertyChanged(obj: any): boolean {
        // hack. chcek if obj has function propertyChanged, and that it has add, remove and raise methods ( -> assume it has event propertyChanged in that case)
        if ((typeof obj.propertyChanged === "object") && (typeof obj.propertyChanged.raise === "function") && (typeof obj.propertyChanged.add === "function") && (typeof obj.propertyChanged.remove === "function")) {
            return true;
        }
        return false;
    }

    export class Size {
        constructor(w: number, h: number, keepNegative?: boolean) {
            this.width = ko.observable(!keepNegative && w < 0 ? 0 : w);
            this.height = ko.observable(!keepNegative && h < 0 ? 0 : h);
        }

        public width: KnockoutObservable<number>;
        public height: KnockoutObservable<number>;
    }

    export class Position {
        constructor(l: number, t: number) {
            this.left = ko.observable(l);
            this.top = ko.observable(t);
        }

        public left: KnockoutObservable<number>;
        public top: KnockoutObservable<number>;
    }

	export class Location {
		constructor(lat: number, lon: number) {
			this.lat = lat;
			this.lon = lon;
		}

		public lat: number;
		public lon: number;
	}

    export class Rectangle {
        constructor(l: number, t: number, w: number, h: number) {
            this.left = ko.observable(l);
            this.top = ko.observable(t);
            this.width = ko.observable(w);
            this.height = ko.observable(h);
        }

        public left: KnockoutObservable<number>;
        public top: KnockoutObservable<number>;
        public width: KnockoutObservable<number>;
        public height: KnockoutObservable<number>;
    }

    export enum ListCellKind {
        Text,
        Image,
        Button,
		InlineButton,
		Editable = 0x1000,
		Clickable = 0x2000,
		DirectEdit = 0x5000,
		ActionMask = 0xF000
    }

    export enum ListCellAnchor {
        None = 0,
        Top = 1,
        Bottom = 2,
        Left = 4,
        Right = 8
    }

    export enum ListCellBorder {
        None = 0,
        Top = 1,
        Bottom = 2,
        Left = 4,
        Right = 8
    }

    export enum ContentAlignment {
        Near,
        Far,
        Center
    }

    export enum FontWeight {
        Regular,
        Bold,
        Italic,
        Underline,
        Strikeout
    }
    export enum LabelPosition {
        Left,
        Top,
        Right,
        Hidden
    }

    export interface IEnumerator<T> {
        current: T;
        moveNext: () => boolean;
        reset: () => void;
    }

    export interface IEnumerable<T> {
        getEnumerator: () => IEnumerator<T>;
    }

    export interface IAsyncEnumerable<T> extends IEnumerable<T> {
        moveNextCompleted: Event<EventArgs>;
        queryCompleted: Event<EventArgs>;
        exception: Exception;
    }

    export function isIAsyncEnumerable(obj: any): boolean {
        // hack. chcek if obj has function moveNextCompleted, queryCompleted and that it has add, remove and raise methods ( -> assume it has event moveNextCompleted, queryCompleted in that case)
        if (obj && (typeof obj.moveNextCompleted === "object") && (typeof obj.moveNextCompleted.raise === "function") && (typeof obj.moveNextCompleted.add === "function") && (typeof obj.moveNextCompleted.remove === "function") &&
            (typeof obj.queryCompleted === "object") && (typeof obj.queryCompleted.raise === "function") && (typeof obj.queryCompleted.add === "function") && (typeof obj.queryCompleted.remove === "function")) {
            return true;
        }
        return false;
    }

    export function hasFunction(obj: any, fname: string): boolean {
        if (obj && (typeof obj[fname] === "function")) {
            return true;
        }
        return false;
    }

    export function isIComparable(obj: any): boolean {
        return hasFunction(obj, "compareTo");
    }

    export interface IComparable<T> {
        compareTo: (a: T) => number;
    }

    export interface IComparer<T> {
        compare: (a: T, b: T) => number;
	}

	export interface ICollection<T> {
		length: number;
		add: (item: T) => void;
		clear: () => void;
		contains: (item: T) => boolean;
		remove: (item: T) => boolean;

		items: T[];
	}

    export class KeyValuePair<TKey, TValue> {
        constructor(k: TKey, v: TValue) {
            this.key = k;
            this.value = v;
        }
        public key: TKey;
        public value: TValue;
    }

    export class Dictionary<TKey, TValue> implements IEnumerable<KeyValuePair<TKey, TValue>> {
        constructor() {
            this.m_list = new Array<KeyValuePair<TKey, TValue>>();
        }

        private m_list: Array<KeyValuePair<TKey, TValue>>;

        public getEnumerator(): IEnumerator<KeyValuePair<TKey, TValue>> {
			var enumer: any = {};
            enumer["list"] = this.m_list;
            enumer["position"] = -1;
            enumer["moveNext"] = () => {
                if (enumer["position"]++ < enumer["list"].length - 1) {
                    enumer["current"] = enumer["list"][enumer["position"]];
                    return true;
                }
                enumer["current"] = null;
                return false;
            };
            enumer["current"] = null;
            enumer["reset"] = () => {
                enumer["position"] = -1;
            }
            return <IEnumerator<KeyValuePair<TKey, TValue>>>enumer;
        }

        public indexOfKey(key: TKey): number {
            for (var i = 0; i < this.m_list.length; i++) {
                if (this.m_list[i].key === key) {
                    return i;
                }
            }
            return -1;
        }

        get length(): number {
            return this.m_list.length;
        }

        public containsKey(key: TKey): boolean {
            return this.indexOfKey(key) >= 0;
        }

        public getValue(key: TKey): TValue {
            var index = this.indexOfKey(key);
            return (index >= 0) ? this.m_list[index].value : undefined;
        }

        public getValues(): Array<TValue> {
            return this.m_list.map(kv => kv.value);
        }

        public getIndex(index: number): TValue {
            return this.m_list[index].value;
        }

        public getKeys(): Array<TKey> {
            return this.m_list.map(kv => kv.key);
        }

        public add(key: TKey, value: TValue) {
            if (this.containsKey(key)) {
                throw new Resco.Exception("Dictionary already contains passed Key");
            }
            this.m_list.push(new KeyValuePair(key, value));
        }

        public set(key: TKey, value: TValue) {
            var index = this.indexOfKey(key);
            if (index >= 0) {
                this.m_list[index] = new KeyValuePair(key, value);
            }
            else {
                this.m_list.push(new KeyValuePair(key, value));
            }
        }

        public remove(key: TKey): boolean {
            var index = this.indexOfKey(key);
            if (index >= 0) {
                this.m_list.splice(index, 1);
                return true;
            }
            return false;
        }

        public clear() {
            this.m_list.splice(0, this.m_list.length);
        }

        public firstOrDefault(predicate: (value: TValue) => boolean, def: TValue): TValue {
            for (var i = 0; i < this.m_list.length; i++) {
                var value = this.m_list[i].value;
                if (predicate(value)) {
                    return value;
                }
            }
            return def;
        }

        public forEach(fn: (kv: Resco.KeyValuePair<TKey, TValue>) => void, caller?: any) {
            if (fn) {
                this.m_list.forEach(kv => caller ? fn.call(caller, kv) : fn(kv));
            }
		}
    }

    export class TextReader {
        private m_lines: Array<string>;
        private m_position: number;


        constructor(lines: Array<string>) {
            this.m_lines = lines;
            this.m_position = 0;
        }

        public close() {
            this.m_lines = null;
            this.m_position = -1;
        }

        public readLine(): string {
            if (this.m_lines && this.m_position <= this.m_lines.length) {
                return this.m_lines[this.m_position++];
            }
            return null;
        }

        public getLines(from?: number, to?: number): string[]{
            return this.m_lines.slice(from, to);
		}

		public readToEnd(): string {
			if (this.m_lines) {
				return this.m_lines.join("\r\n");
			}
			return "";
		}
	}

	export interface IDisposable {
		dispose: () => void;
	}

    // there might be a problem in Math.random() browseer implementation quality
    export function createGuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    export function asString(value: any): string {
        if (typeof value == typeof "") {
            return <string>value;
        }
        return null;
    }

    export function toString(value: any): string {
        if (value && value.toString && typeof value.toString === "function") {
            return value.toString();
        }
        return "";
    }

    export function strictParseFloat(value: string): number {
        if (/^(\-|\+)?([0-9]+(\.[0-9]+)?)$/.test(value)) {
            return Number(value);
        }
        return NaN;
    }

    export function strictParseInt(value: string): number {
        if (/^(\-|\+)?([0-9]+)$/.test(value)) {
            return Number(value);
        }
        return NaN;
    }

    export function notNull(v: any): boolean {
        return !(v === null || v === undefined);
    }

    export function formatString(fmt: string, params: any[]): string {
        var result = "";
        var lastIndex = 0;
        var sBracIndex = fmt.indexOf('{', lastIndex);
        
        while (sBracIndex >= 0 && sBracIndex < fmt.length - 1) {
            if (fmt[sBracIndex + 1] == '{') {   // {{ transforms to { and no format replacement occurs
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
            var decimalPlaces: number = 0;
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

    export function round10(value: any, exp: any) {
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

    export function decimalPlaces(num: any) {
        var match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
        if (!match) { return 0; }
        return Math.max(
            0,
            // Number of digits right of decimal point.
            (match[1] ? match[1].length : 0)
            // Adjust for scientific notation.
            - (match[2] ? +match[2] : 0));
    }

    export function showNotification(title: string, body: string, data: any, callback: (o: any) => void, callbackSource?: any, icon?: string): void {
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

    function _createNotification(title: string, body?: string, data?: any, icon?: string): Notification {
        var options = {
            body: body,
            icon: icon,
            data: data
        }
        return new Notification(title, options);
    }
}

interface String {
    hashCode: () => number;
    startsWith: (prefix: string) => boolean;
    endsWith: (sufix: string) => boolean;
    indexOfAny: (...chars: string[]) => number;
    encodeXML: () => string;
    decodeXML: () => string;
    makePathFromDottedNotation: () => string;
    fromBase64: () => string;
    fromBase64ToBlob: () => Blob;
    toBase64: () => string;
    toUrlSafeBase64: (skipEncoding?: boolean) => string;
	fromUrlSafeBase64: (skipDecoding?: boolean) => string;
	stripLastColon: () => string;
	stringifyText: (encloseIn: string, escapeSingleQuote?: boolean, escapeDoubleQuote?: boolean) => string;
	firstCharToLower: () => string;
}

String.prototype.hashCode = function (): number {
    var hash = 0, i, chr, len;
    if (this.length == 0) return hash;
    for (i = 0, len = this.length; i < len; i++) {
        chr = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

String.prototype.startsWith = function (prefix: string): boolean {
    if (this) {
        if (prefix.length <= this.length) {
            return (this.substr(0, prefix.length) === prefix);
        }
    }
    return false;
}

String.prototype.endsWith = function (sufix: string): boolean {
    if (this) {
        var lastIndex = this.lastIndexOf(sufix);
        return lastIndex >= 0 && (lastIndex + sufix.length) == this.length;
    }
    return false;
}

String.prototype.indexOfAny = function (...chars: string[]): number {
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
}

String.prototype.encodeXML = function (): string {
    return this.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

String.prototype.decodeXML = function (): string {
    return this.replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&');
}

String.prototype.makePathFromDottedNotation = function (): string {
    var index = this.lastIndexOf(".");
    if (index >= 0) {
        var ext = this.substr(index);
        var path = this.substr(0, index);
        return path.replace(".", "\\") + ext;
    }
    return this;
}

String.prototype.toBase64 = function (): string {
    return btoa(encodeURIComponent(this).replace(/%([0-9A-F]{2})/g, function (match, p1) {
        return String.fromCharCode(+('0x' + p1));
    }));
}

String.prototype.fromBase64ToBlob = function (): Blob {
    var decB64 = atob(this);
    var ab = new ArrayBuffer(decB64.length);
    var ua = new Uint8Array(ab);
    for (var i = 0; i < decB64.length; i++) {
        ua[i] = decB64.charCodeAt(i);
    }

    return new Blob([ab]);
}

String.prototype.fromBase64 = function (): string {
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
}

String.prototype.toUrlSafeBase64 = function (skipEncode?: boolean): string {
    var data = this;
    if (!skipEncode) {
        data = this.toBase64();
    }
    return data.replace(/\+/g, '-').replace(/\//g, '_');
}

String.prototype.fromUrlSafeBase64 = function (skipDecode?: boolean): string {
    var dec = this.replace(/-/g, "+").replace(/_/g, "/");
    return skipDecode ? dec : dec.fromBase64();
}

String.prototype.stripLastColon = function (): string {
	var data = this;
	if (data[data.length - 1] == ",") {
		data = data.substring(0, data.length - 1);
	}
	return data;
}

String.prototype.stringifyText = function (encloseIn: string, escapeSingleQuote: boolean = true, escapeDoubleQuote: boolean = true): string {
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
		var escapedValue: string;

		switch (c) {
			case '"': escapedValue = quoteVal; break;
			case '\'': escapedValue = aposVal; break;
			case '\t': escapedValue = '\\\t'; break;
			case '\n': escapedValue = '\\\n'; break;
			case '\r': escapedValue = '\\\r'; break;
			case '\f': escapedValue = '\\\f'; break;
			case '\b': escapedValue = '\\\b'; break;
			case '\\': escapedValue = '\\\\'; break;
			case '\u0085': escapedValue = '\\u0085'; break;
			case '\u2028': escapedValue = '\\u2028'; break;
			case '\u2029': escapedValue = '\\u2029'; break;
			default: escapedValue = c;
		}
		result += escapedValue;
	}
	return result + encloseIn;
}

String.prototype.firstCharToLower = function (): string {
	return this && this.length > 0 ? this[0].toLowerCase() + this.substr(1) : this;
}


interface Number {
	hashCode: () => number;
	compareTo: (o: any) => number;
}

Number.prototype.hashCode = function (): number {
    var d = this;
    if (!d) {
        return 0;
    }
    return d;   // just return the number
};

Number.prototype.compareTo = function (o: any): number {
	if ((typeof o === "number") || (typeof o === "string")) {
		var n = +o;
		if (!isNaN(n))
			return this - n;
	}
	return -1;
};

interface Array<T> {
    firstOrDefault: (callbackfn?: (value: T, index: number, array: T[]) => boolean, def?: T) => T;
	contains: (item: T) => boolean;
}

Array.prototype.firstOrDefault = function (callbackfn?: (value: any, index: number, array: any[]) => boolean, def?: any): any {
	var filter = callbackfn ? this.filter(callbackfn) : this;
    if (filter.length > 0) {
        return filter[0];
    }
    return def;
}

Array.prototype.contains = function (item: any): boolean {
	var filter = this.filter((f: any) => f === item);
	return filter.length > 0;
}

interface Date {
	toJSBridge: () => string;
	compareTo: (o: any) => number;
}

Date.prototype.toJSBridge = function (): string {
	var d = this;
	return Resco.formatString("new Date({0},{1},{2},{3},{4},{5},{6})", [d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()]);
}

Date.prototype.compareTo = function (o: any): number {
	if (o instanceof Date) {
		return this.getTime() - o.getTime();
	}
	return -1;
}

interface Decimal {
	compareTo: (o: any) => number;
}