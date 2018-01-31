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
    var Event = (function () {
        function Event(sender) {
            this.m_sender = sender;
            this.m_handlers = new Array();
            this.m_handlersToBeRemoved = new Array();
            this.m_bRaisingEvent = false;
        }
        Object.defineProperty(Event.prototype, "empty", {
            get: function () {
                return this.m_handlers.length == 0;
            },
            enumerable: true,
            configurable: true
        });
        Event.prototype.raise = function (args, sender) {
            // Make sure every handler is called in raise(), if any handler is removed while in 'for' cycle, remove it after the loop finishes
            this.m_bRaisingEvent = true;
            for (var i = 0; i < this.m_handlers.length; i++) {
                this.m_handlers[i].handler.call(this.m_handlers[i].target, sender ? sender : this.m_sender, args);
                if (args && args.hasOwnProperty("cancel") && args["cancel"]) {
                    break;
                }
            }
            this.m_bRaisingEvent = false;
            for (var i = 0; i < this.m_handlersToBeRemoved.length; i++) {
                this.remove(this.m_handlersToBeRemoved[i].target, this.m_handlersToBeRemoved[i].handler);
            }
            this.m_handlersToBeRemoved.splice(0, this.m_handlersToBeRemoved.length);
        };
        Event.prototype.add = function (target, handler, unique) {
            if (unique) {
                for (var i = 0; i < this.m_handlers.length; i++) {
                    if (this.m_handlers[i].handler == handler && this.m_handlers[i].target == target) {
                        return;
                    }
                }
            }
            this.m_handlers.push(new EventHandlerDescriptor(target, handler));
        };
        Event.prototype.remove = function (target, handler) {
            var index = 0;
            while (index < this.m_handlers.length) {
                if (this.m_handlers[index].handler == handler && this.m_handlers[index].target == target) {
                    if (!this.m_bRaisingEvent) {
                        this.m_handlers.splice(index, 1);
                    }
                    else {
                        this.m_handlersToBeRemoved.push(this.m_handlers[index]);
                        index++;
                    }
                }
                else {
                    index++;
                }
            }
        };
        Event.prototype.clear = function () {
            if (!this.m_bRaisingEvent) {
                this.m_handlers.splice(0, this.m_handlers.length);
            }
            else {
                this.m_handlersToBeRemoved = this.m_handlers.slice(0);
            }
        };
        Object.defineProperty(Event.prototype, "count", {
            get: function () {
                return this.m_handlers.length;
            },
            enumerable: true,
            configurable: true
        });
        return Event;
    }());
    Resco.Event = Event;
    var EventHandlerDescriptor = (function () {
        function EventHandlerDescriptor(t, h) {
            this.target = t;
            this.handler = h;
        }
        return EventHandlerDescriptor;
    }());
    Resco.EventHandlerDescriptor = EventHandlerDescriptor;
    var EventArgs = (function () {
        function EventArgs() {
        }
        EventArgs.Empty = new EventArgs();
        return EventArgs;
    }());
    Resco.EventArgs = EventArgs;
    var ResizeEventArgs = (function (_super) {
        __extends(ResizeEventArgs, _super);
        function ResizeEventArgs(nw, nh, ow, oh) {
            var _this = _super.call(this) || this;
            _this.newSize = new Resco.Size(nw, nh);
            _this.oldSize = new Resco.Size(ow, oh);
            return _this;
        }
        return ResizeEventArgs;
    }(EventArgs));
    Resco.ResizeEventArgs = ResizeEventArgs;
    var PropertyChangedEventArgs = (function (_super) {
        __extends(PropertyChangedEventArgs, _super);
        function PropertyChangedEventArgs(name) {
            var _this = _super.call(this) || this;
            _this.m_propertyName = name;
            return _this;
        }
        Object.defineProperty(PropertyChangedEventArgs.prototype, "propertyName", {
            get: function () {
                return this.m_propertyName;
            },
            enumerable: true,
            configurable: true
        });
        return PropertyChangedEventArgs;
    }(EventArgs));
    Resco.PropertyChangedEventArgs = PropertyChangedEventArgs;
})(Resco || (Resco = {}));
//# sourceMappingURL=event.js.map