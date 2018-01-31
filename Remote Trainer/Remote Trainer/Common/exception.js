var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Resco;
(function (Resco) {
    var Exception = (function () {
        function Exception(msg, ex) {
            this.message = msg;
            this.innerException = ex;
        }
        Exception.as = function (obj) {
            if (obj instanceof Exception) {
                return obj;
            }
            return null;
        };
        Exception.convert = function (obj) {
            var ex = Exception.as(obj);
            if (!ex) {
                ex = new Exception(obj ? obj.toString() : "");
            }
            return ex;
        };
        Object.defineProperty(Exception.prototype, "name", {
            get: function () {
                return this._getName();
            },
            enumerable: true,
            configurable: true
        });
        Exception.prototype._getName = function () {
            return "Exception";
        };
        Exception.prototype.toString = function () {
            return this.name + ": " + this.message;
        };
        return Exception;
    }());
    Resco.Exception = Exception;
    var ArgumentOutOfRangeException = (function (_super) {
        __extends(ArgumentOutOfRangeException, _super);
        function ArgumentOutOfRangeException() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ArgumentOutOfRangeException.prototype._getName = function () {
            return "ArgumentOutOfRangeException";
        };
        return ArgumentOutOfRangeException;
    }(Exception));
    Resco.ArgumentOutOfRangeException = ArgumentOutOfRangeException;
    var ArgumentNullException = (function (_super) {
        __extends(ArgumentNullException, _super);
        function ArgumentNullException() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ArgumentNullException.prototype._getName = function () {
            return "ArgumentNullException";
        };
        return ArgumentNullException;
    }(Exception));
    Resco.ArgumentNullException = ArgumentNullException;
    var ArgumentException = (function (_super) {
        __extends(ArgumentException, _super);
        function ArgumentException() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ArgumentException.prototype._getName = function () {
            return "ArgumentException";
        };
        return ArgumentException;
    }(Exception));
    Resco.ArgumentException = ArgumentException;
    var FormatException = (function (_super) {
        __extends(FormatException, _super);
        function FormatException() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        FormatException.prototype._getName = function () {
            return "FormatException";
        };
        return FormatException;
    }(Exception));
    Resco.FormatException = FormatException;
    var NotImplementedException = (function (_super) {
        __extends(NotImplementedException, _super);
        function NotImplementedException() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        NotImplementedException.prototype._getName = function () {
            return "NotImplementedException";
        };
        return NotImplementedException;
    }(Exception));
    Resco.NotImplementedException = NotImplementedException;
    var InvalidOperationException = (function (_super) {
        __extends(InvalidOperationException, _super);
        function InvalidOperationException() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        InvalidOperationException.prototype._getName = function () {
            return "InvalidOperationException";
        };
        return InvalidOperationException;
    }(Exception));
    Resco.InvalidOperationException = InvalidOperationException;
    var UnauthorizedAccessException = (function (_super) {
        __extends(UnauthorizedAccessException, _super);
        function UnauthorizedAccessException() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        UnauthorizedAccessException.prototype._getName = function () {
            return "UnauthorizedAccessException";
        };
        return UnauthorizedAccessException;
    }(Exception));
    Resco.UnauthorizedAccessException = UnauthorizedAccessException;
    var IndexOutOfRangeException = (function (_super) {
        __extends(IndexOutOfRangeException, _super);
        function IndexOutOfRangeException() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return IndexOutOfRangeException;
    }(Exception));
    Resco.IndexOutOfRangeException = IndexOutOfRangeException;
    var RescoSoapException = (function (_super) {
        __extends(RescoSoapException, _super);
        function RescoSoapException() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        RescoSoapException.prototype._getName = function () {
            return "RescoSoapException";
        };
        return RescoSoapException;
    }(Exception));
    Resco.RescoSoapException = RescoSoapException;
})(Resco || (Resco = {}));
//# sourceMappingURL=exception.js.map