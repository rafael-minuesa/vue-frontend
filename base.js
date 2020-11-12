;(function ($) {
    if (!window.FE_Base) {
        window.FE_Base = {}
    }

    var Store_Methods = FE_Base.Store_Methods = {
        $dispatch: function () {
            return this.$store().dispatch.apply(this, arguments);
        },
        $commit: function () {
            return this.$store().commit.apply(this, arguments);
        },
        $store: function () {
            return this.$root.__$store || this.$options.$store;
        },
        $dataStore: function () {
            var data = this.$store().getters['all'];
            if (arguments.length) {
                switch (arguments.length) {
                    case 1:
                        return data[arguments[0]];
                    case 2:
                        data[arguments[0]] = arguments[1];
                }
            }

            return data;
        },
        getDefaultItemSettings: function (type) {
            var fields = this.$dataStore('post_type_fields'),
                settings = {};

            if (!fields[type]) {
                return settings;
            }

            _.forEach(fields[type], function (a, b) {
                settings[a.id] = a.std;
            });

            return settings;
        },
        _startAnim: function (e, dir) {
            var kb = FE_Helpers.getKeyboard(e);
            if (kb.button !== 'left') {
                return;
            }

            $(e.target).addClass('anim');
        },
        _stopAnim: function (e, dir) {
            var kb = FE_Helpers.getKeyboard(e);
            if (kb.button !== 'left') {
                return;
            }

            $(e.target).removeClass('anim');
        },
        $: function (selector) {
            return selector ? $(this.$el).find(selector) : $(this.$el);
        }
    }


})(jQuery);