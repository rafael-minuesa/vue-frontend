;(function ($) {
    window.$Vue = window.$Vue || Vue;
    window.$VueHTTP = Vue.http;

    window.FE_Helpers = {
        setQueryVar: function (k, v) {
            var url = window.location.href;

            LP.setUrl(url.addQueryVar(k, v))
        },
        removeQueryVar: function (k) {
            var url = window.location.href;

            LP.setUrl(url.removeQueryVar(k))
        },
        Request: function ($store, defaultData) {

            var identify = $store.getters.identify || 'fe_' + LP.uniqueId();

            $VueHTTP.interceptors.push(function (request, next) {
                if (request.params['namespace'] !== identify) {
                    next();
                    return;
                }

                next(function (response) {
                    if (request.params.dataType !== 'raw') {

                        if (!jQuery.isPlainObject(response.body)) {
                            response.body = LP.parseJSON(response.body) || {};
                        }

                        var body = response.body;

                        $store.dispatch('requestComplete', body);
                    }
                });
            });

            return function (url, action, data, params, context) {
                data = $.extend({}, defaultData, data);
                //$(document).trigger('e-start-request')
                $store.dispatch('newRequest', data);

                return new Promise(function (resolve, reject) {
                    $VueHTTP.post(
                        url || '',
                        data,
                        {
                            emulateJSON: true,
                            params: $.extend({
                                namespace: identify,
                                'lp-ajax': action.match(/^fe\//) ? action : 'fe/' + action
                            }, params || {})
                        }
                    ).then(function (response) {
                        resolve(response.body);
                    }, function (response) {
                        reject(response.body)
                    });
                })
            };
        },

        QuickTags: function (edId, tags) {
            var $e = $('#' + edId);
            if (!$e.data('quicktags') && typeof quicktags !== 'undefined') {
                quicktags(tags);

                if (!window.wpActiveEditor) {
                    window.wpActiveEditor = edId;
                }
                $e.data('quicktags', 1);
            }
        },

        debounce: function (func, wait) {
            var timeout;

            return function () {
                var context = this,
                    args = arguments;

                var executeFunction = function () {
                    func.apply(context, args);
                };

                clearTimeout(timeout);
                timeout = setTimeout(executeFunction, wait);
            };
        },

        getKeyboard: function (e) {
            var $target = $(e.target),
                defaultData = {count: 0, countFromEmpty: 0, lastKey: ''},
                data = $target.data('keyboard') || defaultData,
                isEmpty = ($target.val() + '').length === 0,
                keyboard = {
                    code: e.keyCode,
                    key: e.key,
                    ctrl: e.ctrl || e.metaKey,
                    alt: e.altKey,
                    shift: e.shiftKey,
                    context: $target.data('context'),
                    el: e.target
                }

            if (data.lastKey == e.keyCode) {
                data.count++;

                if (isEmpty) {
                    data.countFromEmpty++;
                }
            } else {
                data.count = 1;
                data.lastKey = e.keyCode;

                if (isEmpty) {
                    data.countFromEmpty = 1;
                }
            }

            switch (e.button) {
                case 0:
                    keyboard.button = 'left';
                    break;
                case 1:
                    keyboard.button = 'mid';
                    break;
                case 2:
                    keyboard.button = 'right';
            }

            $target.one('blur', function () {
                var data = $(this).data('keyboard') || defaultData;
                data.count = 0;
                $(this).data('keyboard', data);
            });

            $target.data('keyboard', data);

            keyboard.count = data.count;
            keyboard.countFromEmpty = data.countFromEmpty;

            return keyboard;
        },
        clone: function (obj) {
            return JSON.parse(JSON.stringify(obj || {}))
        },
        sortArrayByDOM: function (array, field_order, field_id, $els) {
            var tempArray = this.clone(array);

            if (!field_order) {
                field_order = '__order';
            }

            $($els).each(function (i, el) {
                var id = $(this).attr('data-id');
                for (var j = 0, n = tempArray.length; j < n; j++) {
                    if (tempArray[j][field_id] == id) {
                        tempArray[j][field_order] = i + 1;
                        break;
                    }
                }
            });


            tempArray.sort(function (a, b) {
                if (a[field_order] < b[field_order]) return -1;
                if (a[field_order] > b[field_order]) return 1;
                return 0;
            });

            return tempArray;
        },
        listPluck: function (array, field) {
            var r = [];
            for (var i in array) {
                if (array[i][field] !== undefined) {
                    r.push(array[i][field]);
                }
            }

            return r;
        },
        omitObjects: function (obj) {
            var o = {};
            for (var prop in obj) {
                if (!!(obj[prop] && obj[prop].constructor && obj[prop].call && obj[prop].apply)) {
                    continue;
                }

                if (obj[prop].toString && obj[prop].toString() === '[object Object]' && !$.isPlainObject(obj[prop])) {
                    continue;
                }

                o[prop] = obj[prop];
            }

            return o;
        },
        fireNativeEvent: function (node, eventName) {
            var doc, event;
            if (node.ownerDocument) {
                doc = node.ownerDocument;
            } else if (node.nodeType == 9) {
                doc = node;
            } else {
                throw new Error("Invalid node passed to fireEvent: " + node.id);
            }

            if (node.dispatchEvent) {
                var eventClass = "";

                switch (eventName) {
                    case "click":
                    case "mousedown":
                    case "mouseup":
                        eventClass = "MouseEvents";
                        break;

                    case "focus":
                    case "change":
                    case "blur":
                    case "select":
                        eventClass = "HTMLEvents";
                        break;
                    case 'input':
                        return node.dispatchEvent(new Event('input'));
                        break;
                    default:
                        throw "fireEvent: Couldn't find an event class for event '" + eventName + "'.";
                        break;
                }
                event = doc.createEvent(eventClass);
                event.initEvent(eventName, true, true);
                event.synthetic = true;
                node.dispatchEvent(event, true);
            } else if (node.fireEvent) {
                event = doc.createEventObject();
                event.synthetic = true;
                node.fireEvent("on" + eventName, event);
            }
        },
        /**
         * Create select2 for an element and watch on the changes
         * to trigger an 'native' event to make sure Vue model works
         * properly.
         *
         * @param el
         * @param args
         */
        select2: function (el, args) {
            $(el).select2(args).on('select2:select', FE_Helpers.debounce(function (e) {
                FE_Helpers.fireNativeEvent(e.target, 'change');
            }, 50)).on('select2:unselect', FE_Helpers.debounce(function (e) {
                FE_Helpers.fireNativeEvent(e.target, 'change');
            }, 50));
        },

        startActivity: function () {
            jQuery(document).trigger('fe.start-activity');
        },
        stopActivity: function () {
            jQuery(document).trigger('fe.stop-activity');
        }
    }

    Object.defineProperty(Array.prototype, 'listPluck', {
        value: function (field) {
            return FE_Helpers.listPluck(this, field);
        }
    });

    var Notifications = function () {

    }
})(jQuery);