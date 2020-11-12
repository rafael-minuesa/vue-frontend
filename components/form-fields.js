;(function ($) {
    Vue.component('e-form-field-text', {
        template: '#tmpl-e-form-field-text',
        props: ['item', 'itemData', 'request', 'field', 'settings'],
        data: function () {
            return {
                drawComponent: true
            }
        },
        created: function () {
        },
        mounted: function () {
        },
        methods: {
            redraw: function () {
                var vm = this;
                vm.drawComponent = false;
                Vue.nextTick(function () {
                    vm.drawComponent = true;
                });
            }
        }
    });

    Vue.component('e-form-field-textarea', {
        template: '#tmpl-e-form-field-textarea',
        props: ['item', 'itemData', 'request', 'field', 'settings'],
        data: function () {
            return {
                drawComponent: true,
            }
        },
        created: function () {
        },
        mounted: function () {
        },
        methods: {
            redraw: function () {
                var vm = this;
                vm.drawComponent = false;
                Vue.nextTick(function () {
                    vm.drawComponent = true;
                });
            }
        }
    });

    Vue.component('e-form-field-duration', {
        template: '#tmpl-e-form-field-duration',
        props: ['item', 'itemData', 'request', 'field', 'settings'],
        data: function () {
            return {
                drawComponent: true,
                settingValue: this.get()
            }
        },
        watch: {
            settingValue: function (value) {
                this.itemData.settings[this.field.id] = value.join(' ')
                return value;
            }
        },
        created: function () {
        }, mounted: function () {
        },
        methods: {
            redraw: function () {
                var vm = this;
                vm.drawComponent = false;
                Vue.nextTick(function () {
                    vm.drawComponent = true;
                });
            },
            get: function () {
                var settings = this.itemData.settings || {},
                    number = parseInt(settings[this.field.id]),
                    v = (settings[this.field.id] + '').replace(/[0-9]+\s?/, '');
                return [number ? number : 0, v ? v : 'minute']
            }
        }
    });

    Vue.component('e-form-field-yes-no', {
        template: '#tmpl-e-form-field-yes-no',
        props: ['item', 'itemData', 'request', 'field', 'settings'],
        data: function () {
            return {
                drawComponent: true,
                //settingValue: this.get()
            }
        },
        computed: {
            settingValue: {
                get: function () {
                    var settings = this.itemData.settings || {};
                    return settings[this.field.id];
                },
                set: function (v) {
                    this.itemData.settings[this.field.id] = v;
                }
            }
        },
        watch: {
            settingValuex: function (value) {
                this.itemData.settings[this.field.id] = value ? 'yes' : 'no';
                return value;
            }
        },
        methods: {
            redraw: function () {
                // var vm = this;
                // vm.drawComponent = false;
                // Vue.nextTick(function () {
                //     vm.drawComponent = true;
                // });
            },
            // get: function () {
            //     var settings = this.itemData.settings || {};
            //     //this.itemData.settings[this.field.id] === 'yes'
            //     console.log('GET', settings[this.field.id])
            //     return settings[this.field.id] === 'yes';
            // }
        }
    });

    Vue.component('e-tinymce', {
        template: '#tmpl-e-tinymce',
        props: {
            id: {
                type: 'String',
                required: true
            },
            value: {default: ''},
            redraw: {
                type: 'Boolean'
            }
        },
        data: function () {
            return {
                content: '',
                isTyping: false,
                editorMode: true
            }
        },
        beforeDestroy: function () {
            this.$editor.destroy();
        },
        watch: {
            value: function (newValue) {
                if (!this.isTyping && this.$editor !== null) {
                    setTimeout(function ($m, value) {
                        $m.$editor.setContent(value);
                    }, 70, this, newValue)
                }
                this.$emit('input', newValue);
                return newValue;
            },
            content: function (v) {
                //this.$editor.setContent(v);
                return v;
            }
        },
        mounted: function () {
            this.content = this.value;
            this.init();
        },
        methods: {
            init: function () {
                var self = this;
                var tinyMCEInit = $.extend({}, tinyMCEPreInit.mceInit.post_content, {
                    selector: '#' + this.id,
                    setup: function ($editor) {
                        self.$editor = $editor;

                        $editor.on('Change KeyUp', $.proxy(function (e, b) {
                            this.onChange();
                        }, self));

                    },
                    height: 400
                });
                tinymce.init(tinyMCEInit);

                var tags = $.extend({}, tinyMCEPreInit.qtInit['post_content']);
                tags.id = this.id;
                FE_Helpers.QuickTags(this.id, tags);
            },
            onChange: function () {
                this.isTyping = true;
                FE_Helpers.debounce(function ($vm) {
                    $vm.isTyping = false;
                }, 100)(this);
                this.$emit('input', this.$editor.getContent());
            },
            switchMode: function () {
                this.editorMode = !this.editorMode;
                tinymce.execCommand('mceToggleEditor', this.editorMode, this.id)
            },
            getEditorId: function () {
                return 'wp-' + this.id + '-wrap';
            }
        }
    });
})(jQuery);