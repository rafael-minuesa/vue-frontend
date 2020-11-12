;(function ($) {
    var mixin = {
        template: '#tmpl-e-question',
        props: ['question', 'itemData'],
        data: function () {
            return {
                newID: 0,
                redraw: true,
                checkedAnswer: '',
                showSettingsBox: false
            }
        },
        watch: {
            // question: {
            //     handler: function (v) {
            //         return v;
            //     }, deep: true
            // },
            checkedAnswer: function (v) {
                this._setCheckAnswer(v);
                return v;
            }
        },
        computed: {
            answers: {
                get: function () {
                    var answers = this.question.answers;
                    if (!answers || answers.length === 0) {
                        answers = [{
                            id: LP.uniqueId(),
                            question_answer_id: LP.uniqueId(),
                            value: LP.uniqueId(),
                            text: ''
                        }];
                    }
                    return answers;
                },
                set: function (v) {
                    this.question.answers = v;
                }
            }
        },
        mounted: function () {
            var $vm = this, props = ['title', 'content'], i;
            for (i = 0; i < props.length; i++) {

                this.$watch('question.' + props[i], (function ($vm, prop) {
                    return function (value) {
                        $vm.watchChangeQuestion(prop, value);
                    }
                })(this, props[i]))
            }

            $(this.$el).find('.e-question-answers').sortable({
                handle: '.sort',
                axis: 'y',
                update: $.proxy(function (e, ui) {
                    this.$set(this.question, 'answers', FE_Helpers.sortArrayByDOM(this.answers, 'answer_order', 'question_answer_id', $(e.target).children()));
                    this._redraw();
                }, this)
            });

            $('#e-item-settings').addClass('editing-question').find('.e-item-settings-content').scrollTop(0);

            window['FE_Question_' + this.question.id] = this;
        },
        methods: $.extend({}, FE_Base.Store_Methods, {

            /**
             * Watches to check any change happens in current question.
             */
            watchChangeQuestion: FE_Helpers.debounce(function (prop, value) {
                var question = {
                    id: this.question.id
                };

                question[prop] = value;

                this.$dispatch('updateQuestion', {
                    quiz_ID: this.itemData.id,
                    context: prop,
                    question: question
                }).then(function (r) {
                    if (r.result === 'success') {

                    }
                });

            }, 1000, this),
            countAnswers: function () {
                return this.answers ? this.answers.length : 0;
            },
            getQuestionIndex: function () {
                var $vm = this,
                    index = (this.itemData ? this.itemData.questions.findIndex(function (q) {
                            return q.id === $vm.question.id;
                        }) : 0) + 1;

                return index < 10 ? '0' + index : index;
            },
            _redraw: function () {
                this.redraw = false;
                this.$nextTick(function () {
                    this.redraw = true;
                });
            },
            edit: function () {
                this.$emit('edit-question', this);
            },
            getDataStore: function () {
                return this.$root.$store();
            },
            setDefaultCheckedAnswer: function () {
                for (var i = 0, n = this.answers.length; i < n; i++) {
                    if (this.answers[i].is_true === 'yes') {
                        return;
                    }
                }

                this.answers[0].is_true = 'yes';
            },
            getAnswerIndex: function (id) {
                return this.answers.findIndex(function (a) {
                    return a.question_answer_id == id;
                });
            },
            isSupport: function (feature) {
                var thisType = this.question.type,
                    typeObj = this.$dataStore().question_types.find(function (a) {
                        return a.type == thisType;
                    });

                if ((!typeObj || !typeObj.supports)) {
                    return false;
                }

                return typeObj.supports[feature];
            },
            _addAnswer: function (e, id) {
                var position = this.getAnswerIndex(id);
                this.addAnswer(position !== -1 ? position + 1 : null);
            },
            _add: function () {
            },
            _deleteAnswer: function (e, id) {

                if (2 >= this.countAnswers()) {
                    return;
                }

                var find = this.getAnswerIndex(id)

                if (find !== -1) {
                    if (this.answers[find].is_true === 'yes' && !confirm(FE_Localize.get('confirm_delete_checked_answer'))) {
                        return;
                    }
                    this.answers.splice(find, 1);

                    this.setDefaultCheckedAnswer();
                    this.updateQuestionAnswers();
                }
            },
            _back: function (e) {
                e.preventDefault();

                /// ???
                this.$parent._closeQuestion(e);
            },
            _setCheckAnswer: function (e) {
                var $checks = $(e.target).closest('.e-question-answers').find('input.e-answer-check-input');

                if (!$checks.filter(':checked').length) {
                    if (!confirm(FE_Localize.get('question_require_at_least_checked_answer'))) {
                        e.target.checked = true;
                        return;
                    }
                }

                if ($checks.filter(':checked').length === $checks.length) {
                    if (!confirm(FE_Localize.get('question_have_all_answer_checked'))) {
                        e.target.checked = false;
                        return;
                    }
                }

                for (var i = 0, n = $checks.length; i < n; i++) {
                    this.answers[i].is_true = $checks[i].checked ? 'yes' : 'no';
                }
                this.updateQuestionAnswers();
            },
            _onBlurAnswerInput: function (e) {
                this.updateQuestionAnswers();
            },
            updateQuestionAnswers: FE_Helpers.debounce(function () {
                var $vm = this;
                this.$dispatch('updateQuestion', {
                    quiz_ID: this.itemData.id,
                    context: 'update-answers',
                    question: {
                        id: this.question.id,
                        answers: this.answers
                    }
                }).then(function (r) {
                    if (r.result === 'success') {
                        if (r.question_answer_ids) {
                            $.each($vm.question.answers, function (i, v) {
                                if (r.question_answer_ids[v.question_answer_id] !== undefined) {
                                    $vm.question.answers[i].question_answer_id = r.question_answer_ids[v.question_answer_id];
                                }
                            });
                        }
                    }
                });
            }, 1000),
            answerClass: function (answer) {
                var cls = ['e-question-answer e-sort-item'];

                if (answer.question_answer_id <= 0 || isNaN(answer.question_answer_id)) {
                    cls.push('new-item');
                }

                return cls;
            },
            getAnswerCheckType: function () {
                var checkType = 'checkbox';

                if (this.isSingleChoice()) {
                    checkType = 'radio';
                }

                return checkType;
            },
            isSingleChoice: function () {
                return $.inArray(this.question.type, ['true_or_false', 'single_choice']) !== -1;
            },
            isCheckedAnswer: function (answer) {
                return answer.is_true === 'yes';
            },
            addAnswer: function (position) {
                position = parseInt(position);

                if (!this.isSupport('add_answer')) {
                    return;
                }

                if (!this.answers) {
                    this.answers = [];
                }

                if (position < 0 || isNaN(position)) {
                    position = this.answers.length;
                }

                this.newID = LP.uniqueId();
                var answer = {
                    question_answer_id: this.newID,
                    question_id: this.question.id,
                    answer_order: position,
                    text: '',
                    value: this.newID,
                    is_true: 'no'
                };

                this.answers.splice(position, 0, answer);
                $(this.$el).find('.e-question-answers .new-item').addClass('paused');
                this.$nextTick(function () {
                    this.focusNewAnswer();
                    $(this.$el).find('.e-question-answers .new-item').removeClass('paused');
                });
            },
            getAnswerIndexLabel: function (index) {
                return index !== undefined ? (index) + '.' : '';
            },
            focusNewAnswer: function () {
                $(this.$el).find('[data-id="' + this.newID + '"] .e-question-answer-input').focus();
            },
            onKeydown: function (e) {
                var keyboard = FE_Helpers.getKeyboard(e),
                    $answer = $(e.target).closest('.e-question-answer'),
                    $answers = $answer.parent().children(),
                    position = $answers.index($answer);

                switch (keyboard.code) {
                    case 13:
                        e.preventDefault();
                        if (e.target.value.length) {
                            this.addAnswer(position + 1);
                        }
                        break;
                    case 38:
                    case 40:
                        e.preventDefault();
                        if (keyboard.code === 38) {
                            if (position === 0) {
                                position = $answers.length - 1;
                            } else {
                                position--;
                            }
                        } else {
                            if (position === $answers.length - 1) {
                                position = 0;
                            } else {
                                position++;
                            }
                        }
                        $answers.eq(position).find('.e-question-answer-input').focus();
                }
            },
            getPrevQuestionIndex: function (leadingZero) {
                var $vm = this;

                var at = this.itemData.questions.findIndex(function (a) {
                    return a.id == $vm.question.id
                }), index = at > 0 ? at : 0;

                return leadingZero && index < 10 ? '0' + index : index;
            },
            getNextQuestionIndex: function (leadingZero) {
                var $vm = this;

                var at = this.itemData.questions.findIndex(function (a) {
                    return a.id == $vm.question.id
                }), index = at < this.itemData.questions.length - 1 ? at + 2 : 0;

                return leadingZero && index < 10 ? '0' + index : index;
            },
            getPrevQuestionTitle: function () {
                var at = this.getPrevQuestionIndex();

                if (at == 0) {
                    return '';
                }

                return this.itemData.questions[at - 1].title;
            },
            getNextQuestionTitle: function () {
                var at = this.getNextQuestionIndex();

                if (at == 0) {
                    return '';
                }

                return this.itemData.questions[at - 1].title;
            },
            getQuestionAnswersComponent: function () {
                var component = $(document).triggerHandler('FE.question-answers-component', this.question);
                return component
            },
            _loadQuestion: function (e, type) {
                e.preventDefault();
                var at = -1;
                switch (type) {
                    case 'prev':
                        at = this.getPrevQuestionIndex();
                        break;
                    default:
                        at = this.getNextQuestionIndex();
                }

                this.$emit('load-question', at - 1, 'position');
                $(this.$el).scrollTop(0)
            }
        })
    };

    Vue.component('e-question', {
        mixins: [mixin]
    });

    $(document).on('FE.question-answers-component', function (e, question) {
        if (question.type === 'fill_in_blank') {
            return 'fib-question-answers';
        }
    });

    Vue.component('fib-question-answers', {
        template: '#tmpl-fib-question-answers',
        props: ['question'],
        data: function () {
            return {
                valid: true,
                canInsertNewBlank: false,
                blanks: []
            }
        },
        computed: {
            answer: function () {
                return {
                    answer_order: 1,
                    is_true: '',
                    question_answer_id: this.answers[0].question_answer_id,
                    text: this.answers[0].text,
                    value: ''
                };
            },
            answers: function () {
                return this.answers
            }
        },
        mounted: function () {
            var that = this,
                content = this.getContent();
            this.blanks = this.answers[0].blanks || [];
            this.$editor = $(this.$el).find('.content-editable');
            this.$editor.html(content);
            this.parseBlanks(content);
            this.$editor[0].addEventListener("DOMCharacterDataModified", function (e) {
                var $target = $(e.target).parent(), id = $target.data('id');
                for (var i in that.blanks) {
                    if (that.blanks[i].id == id) {
                        that.blanks[i].fill = $target.html().trim();
                        that.$activeBlank = $target;
                        break;
                    }
                }
            }, false);

            // this.interval = setInterval(function (a) {
            //     a.parseBlanks(a.getContent());
            // }, 1000, this);
        },
        methods: {
            updateAnswer: FE_Helpers.debounce(function () {
                this.parseBlanks();
                var answer = JSON.parse(JSON.stringify(this.answer));
                answer.text = this.getShortcode();
                answer.blanks = this.getBlanksForDB();

                FE_Helpers.Course_Editor_Request('', 'e_ajax_update_fib', {
                    question_id: this.question.id,
                    answer: answer
                }).then(function (res) {
                })

            }, 1000, this),
            updateAnswerBlank: function (e, blank) {
                this.updateAnswer();
            },
            getContent: function () {
                var content = this.answers[0].text,
                    shortcodes = content.match(/\[fib.*?\]/g),
                    uids = {};

                if (shortcodes) {
                    for (var i = 0; i < shortcodes.length; i++) {
                        var uid,
                            fill,
                            replaceText,
                            props = shortcodes[i].match(/([a-z_]+)="(.*?)"/g),
                            data = [];

                        for (var j in props) {

                            if (!props.hasOwnProperty(j)) {
                                continue;
                            }

                            var prop = props[j].match(/([a-z_]+)="(.*?)"/);

                            if (!prop) {
                                continue;
                            }

                            switch (prop[1]) {
                                case 'uid':
                                case 'id':
                                    uid = prop[2];
                                    break;
                                case 'fill':
                                    fill = prop[2];
                                    break;
                                default:
                                    data.push('data-' + prop[1] + '="' + prop[2] + '"')
                            }
                        }

                        uid = uid ? uid : LP.uniqueId();

                        if (uids[uid]) {
                            uid = LP.uniqueId();
                        }

                        replaceText = FIB.outerHTML(this.createBlank(fill, uid).attr('data-index', i + 1));// '<span class="fib-blank" id="fib-blank-' + uid + '" data-id="' + uid + '" data-index="' + (i + 1) + '">' + fill + '</span>';
                        uids[uid] = true;

                        content = content.replace(shortcodes[i], replaceText);
                    }
                }
                return content;
            },
            activeBlank: function (e) {
                this.$activeBlank = $(e.target).closest('.fib-blank');
            },

            findBlank: function (id) {
                for (var i in this.blanks) {
                    if (this.blanks[i].id == id) {
                        return this.blanks[i];
                    }
                }

                return false;
            },
            parseBlanks: function (content) {
                var $container = this.$editor,
                    $inputs = $container.find('.fib-blank'),
                    $input,
                    data,
                    blanks = [], uids = [],
                    i = 0, n = 0;

                for (i = 0; i < $inputs.length; i++) {
                    $input = $inputs.eq(i).attr('data-index', i + 1);
                    data = $input.data();

                    if (-1 !== $.inArray(data.id, uids)) {
                        data.id = LP.uniqueId();
                    }

                    var oldBlank = this.findBlank(data.id) || {};

                    blanks.push({
                        fill: $input.html().trim(),
                        id: data.id,
                        comparison: data.comparison || oldBlank.comparison || '',
                        match_case: data.match_case || oldBlank.match_case || 0,
                        index: i + 1,
                        open: !!oldBlank.open
                    });
                    uids.push(data.id);
                }
                this.blanks = blanks;
            },
            updateBlanks: function (content) {
                this.parseBlanks(content !== undefined ? content : this.$editor.html());
                return this.getShortcode();
            },
            getShortcode: function () {
                var that = this,
                    $container = this.$editor.clone(),
                    $blanks = $container.find('.fib-blank');

                $blanks.each(function () {
                    var $blank = $(this),
                        id = $blank.attr('id'),
                        uid = id.replace('fib-blank-', ''),
                        blank = that.getBlankById(uid),
                        code = 'fib';

                    if (blank) {
                        if (!blank.id) {
                            return;
                        }
                        for (var i in blank) {
                            if ($.inArray(i, ['index']) !== -1) {
                                continue;
                            }

                            if (!blank[i]) {
                                continue;
                            }

                            code += ' ' + i + '="' + blank[i] + '"';
                        }
                        $blank.replaceWith('[' + code + ']');
                    } else {
                        console.log('Not found: ' + uid)
                        $blank.replaceWith('')
                    }
                });
                return $container.html();
            },
            getBlankById: function (id) {
                var blank = false;
                $.each(this.blanks, function () {
                    if (id == this.id) {
                        blank = this;
                        return true;
                    }
                });
                return blank;
            },
            updateBlank: function (e) {
                var $el = $(e.target),
                    id = $el.attr('id'),
                    $blank = this.$editor.find('#' + id);
                $blank.html(e.target.value);
                this.updateAnswer();
            },
            removeBlank: function (e, id) {
                e.preventDefault();
                this.removeBlankById(id);
                this.updateAll();
            },
            removeBlankById: function (id) {
                var $blank = this.$editor.find('.fib-blank#fib-blank-' + id);
                $blank.replaceWith($blank.html());
            },
            updateAll: function () {
                this.answer.text = this.updateBlanks();
                this.updateAnswer();
            },
            insertBlank: function () {
                if (!this.canInsertNewBlank) {
                    return;
                }

                var $content = $(this.$el).find('.content-editable'),
                    content = $content.html(),
                    selectedText = FIB.getSelectedText(),
                    selectionRange = FIB.getSelectionRange(),
                    $blank = this.createBlank(selectedText),
                    nodeValue = selectionRange.anchorNode.nodeValue,
                    startRange = selectionRange.anchorOffset,
                    endRange = startRange + selectedText.length;// selectionRange.focusOffset;

                selectionRange.anchorNode.nodeValue = nodeValue.substr(0, startRange);
                $($blank).insertAfter(selectionRange.anchorNode);
                $(FIB.createTextNode(nodeValue.substr(endRange))).insertAfter($blank);

                var $blanks = $content.find('.fib-blank');
                $blanks.each(function (i, el) {
                    var $blank = $(this);
                    $blank.attr('data-index', i + 1)
                });

                this.parseBlanks($content.html());
                this.updateAnswer();
            },
            createBlank: function (content, id) {
                if (!id) {
                    id = LP.uniqueId();
                }
                return $('<b class="fib-blank" id="fib-blank-' + id + '" data-id="' + id + '"> ' + content + '</b>');
            },
            clearBlanks: function () {
                if (!confirm($store.getters['i18n/all'].confirm_remove_blanks)) {
                    return;
                }

                for (var i in this.blanks) {
                    this.removeBlankById(this.blanks[i].id);
                }
                this.updateAll();
            },
            clearContent: function () {
                this.$editor.html('');
                this.updateAnswer();
            },
            canInsertBlank: function () {
                var $content = $(this.$el).find('.content-editable'),
                    content = $content.html(),
                    selectedText = FIB.getSelectedText(),
                    selectionRange = FIB.getSelectionRange();

                this.canInsertNewBlank = selectedText.length && !FIB.isContainHtml(selectionRange.anchorNode);
            },
            getBlanksForDB: function () {
                var blanks = {};
                for (var i = 0, n = this.blanks.length; i < n; i++) {
                    var id = this.blanks[i].id.replace('fib-blank-', '');
                    blanks[id] = JSON.parse(JSON.stringify(this.blanks[i]));
                    blanks[id].id = id;
                }
                return blanks;
            },
            toggleOptions: function (e, id) {
                e.preventDefault();
                var that = this;
                $(e.target).closest('.fib-blank').find('.blank-options ul').slideToggle(function () {
                    that.setBlankProp(id, 'open', !$(this).is(':hidden'))
                })
            },
            setBlankProp: function (id, prop, value) {
                for (var i in this.blanks) {
                    if (this.blanks[i].id == id) {
                        if ($.isPlainObject(prop)) {
                            for (var p in prop) {
                                this.$set(this.blanks[i], p, prop[p]);
                            }
                        } else {
                            this.$set(this.blanks[i], prop, value);
                        }

                        break;
                    }
                }
                this.updateAnswer();
            }
        }
    });
})(jQuery);