;(function ($) {
    "use strict";

    Vue.component('e-question-loop', {
        template: '#tmpl-e-question-loop',
        props: ['question', 'hidden', 'index', 'itemData', 'key', 'placeholder'],
        watch: {
            question: {
                handler: function () {
                },
                deep: true
            },
            'question.settings': {
                handler: function (settings) {
                    this.updateQuestionSettings();
                },
                deep: true
            }
        },
        computed: {
            questionMark: {
                get: function () {
                    return this.question.settings ? this.question.settings._lp_mark : 1;
                },
                set: function (v) {
                    this.question.settings._lp_mark = v;
                }
            },
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
            var $vm = this, prop;

            if(this.placeholder){
                this.question.title = '';
                $(this.$refs.questionTitle).focus();
            }
        },
        methods: $.extend(FE_Base.Store_Methods, {
            edit: function () {
                this.$emit('edit-question', this);
            },

            /**
             * Update question settings when it change
             */
            updateQuestionSettings: FE_Helpers.debounce(function () {
                this.$dispatch('updateQuestionSettings', {
                    question_ID: this.question.id,
                    settings: this.question.settings
                }).then(function (response) {
                });
            }, 300, this),
            watchQuestionSettingsChange: function (prop, value) {
            },
            watchQuestionChange: function (prop, value) {
            },
            getTypeName: function () {
                var thisType = this.question.type;
                var typeObj = this.$dataStore('question_types').find(function (a) {
                    return a.type == thisType;
                });

                return typeObj ? typeObj.name : '';
            },
            questionClass: function () {
                var cls = ['e-question-loop e-sort-item ' + this.question.type];

                if (isNaN(this.question.id)) {
                    cls.push('new-item')
                }

                if (this.placeholder) {
                    cls.push('placeholder')
                }

                return cls;
            },
            getQuestionIndexLabel: function () {
                return this.index !== undefined ? (this.index + 1) + '.' : '';
            },
            countQuestions: function () {
                var count = this.answers ? this.answers.length : 0,
                    filterCount;

                filterCount = $(document).triggerHandler('FE.count-question-answers', [count, this]);

                if (filterCount !== undefined) {
                    count = filterCount;
                }

                return count;
            },
            isNew: function () {
                return this.question.id && isNaN(this.question.id) || !this.question.id;
            },
            _onKeydown: function (e) {
                if (e.keyCode === 13) {
                    if (!(e.target.value + '').length) {
                        e.preventDefault();
                        return;
                    }
                }
                this.$emit('press-question-title', [e, this]);
            },
            _switch: function (e) {


                var $vm = this,
                    $li = $(e.target),
                    $ul = $li.closest('ul'),
                    oldType = this.question.type,
                    newType = $li.attr('data-type');
                $ul.hide();

                FE_Helpers.debounce(function () {
                    $ul.css('display', '');
                }, 300)();

                // Emit event to change type of question
                this.$emit('change-question-type', newType);

                // If this is new question then add new question
                // if (this.isNew() && this.question.title) {
                //     this.$emit('add-new-question', this.question);
                //     this.question.title = '';
                //     return;
                // }

                if (this.placeholder) {
                    this.question.type = newType;

                    return;
                }

                if (!confirm(FE_Localize.get('confirm_change_question_type'))) {
                    return;
                }

                this.question.type = newType;
                this.$dispatch('changeQuestionType', {
                    quiz_ID: this.itemData.id,
                    question: {
                        id: this.question.id,
                        oldType: oldType,
                        newType: newType
                    }
                }).then(function (r) {
                    if (r.answers) {
                        Vue.set($vm.question, 'answers', r.answers)
                    }
                })
            },
            _onBlur: function (e) {
                this.$emit('update-question-title', {
                    context: 'title',
                    event: e,
                    $vm: this
                });
            },
            /**
             * Delete question from quiz.
             *
             * @param {MouseEvent} e
             * @private
             */
            _delete: function (e) {

                var trashQuestion = false, confirmed;

                if ($(e.target).data('mouse_hold_time') > 1100) {
                    trashQuestion = true;
                }

                if (trashQuestion) {
                    confirmed = confirm(FE_Localize.get('confirm_trash_question_in_quiz'))
                } else {
                    confirmed = confirm(FE_Localize.get('confirm_remove_question_in_quiz'));
                }

                // Do nothing!
                if (!confirmed) {
                    return;
                }

                this.$emit('delete-question', e, trashQuestion, this);
            }
        })
    });


    Vue.component('e-quiz-editor', {
        template: '#tmpl-e-quiz-editor',
        props: ['section', 'item', 'itemData'],
        data: function () {
            return {
                editID: -1,
                question: null,
                hidden: false,
                newQuestionID: -1,
                defaultQuestion: {
                    title: '',
                    type: '',
                    answers: []
                }
            }
        },
        computed: {
            questions: {
                get: function () {
                    return this.itemData.questions || [];
                },
                set: function (v) {
                    this.itemData.questions = v;
                }
            }
        },
        watch: {},
        created: function () {
            this.defaultQuestion.type = this.$dataStore('question_types')[0].type;

            if (!this.itemData.questions) {
                Vue.set(this.itemData, 'questions', []);
                this.questions = [];
            }
        },
        mounted: function () {
            var me = this;
            $(document).on('e-item-settings', function (e, settings) {
                if (settings.__type === 'lp_quiz') {
                    settings.questions = me.itemData.questions;
                }
                return settings;
            });

            this.makeSortable();
            var keys = [];
            $(document).on('keyup', function (e) {
                if ($(e.target).is('input, select, textarea')) {
                    keys = [];
                    return;
                }
                keys.push(e.key.toLowerCase());

                if (keys.length > 1) {
                    var lastKeys = keys.slice(-2);
                    var doAction = true;
                    switch (lastKeys.join('')) {
                        case 'cq':
                            me.addQuestion();
                            break;
                        case 'eq':
                            me.question = me.questions[0];
                            me.editID = me.question.id;
                            //this.$emit('edit-question', this.question);
                            break;
                        default:
                            doAction = false;
                    }

                    if (doAction) {
                        keys = [];
                    }
                }
            })
        },
        methods: $.extend({}, FE_Base.Store_Methods, {
            makeSortable: function () {
                $(this.$el).find('.e-questions').sortable({
                    handle: '.sort',
                    axis: 'y',
                    items: '.e-question-loop:not(.placeholder)',
                    update: $.proxy(function (e, ui) {
                        this.itemData.questions = FE_Helpers.sortArrayByDOM(this.questions, 'order', 'id', $(e.target).children());
                        this.$dispatch('updateQuestionsOrder', {
                            quiz_ID: this.itemData.id,
                            questions: this.itemData.questions.listPluck('id')
                        });
                        this.redraw();
                    }, this)
                });
            },
            redraw: function () {
                this.hidden = true;
                this.$nextTick(function () {
                    this.hidden = false;
                    this.$nextTick(function () {
                        this.makeSortable();
                    })
                });
            },
            getQuestions: function () {
                return this.questions;
            },
            _addNew: function () {
                this.addQuestion();
            },
            editQuestion: function (question) {
                this.editID = question.question.id;
                this.question = question.question;
                this.$emit('edit-question', this.question);

            },
            isEditingQuestion: function () {
                return this.editID !== -1;
            },
            close: function (e) {
                e.preventDefault();
                this.editID = -1;
                this.$emit('edit-question', null);
                $('#e-item-settings').removeClass('editing-question')

            },
            update: function (e) {
                e.preventDefault();
                this.$root.$request('', 'update-question', {
                    quiz_ID: this.itemData.id,
                    question: this.question
                }).then(function (response) {

                })
            },
            addQuestion: function (position, questionData) {
                if (!this.questions) {
                    this.questions = [];
                }

                if (position === undefined) {
                    position = this.questions.length;
                }

                var type = this.$dataStore('question_types').random();
                this.newQuestionID = LP.uniqueId();
                var question = $.extend({
                    id: this.newQuestionID,
                    title: '',
                    settings: this.getDefaultItemSettings('lp_question'),
                    type: type.type,
                    answers: []
                }, questionData || {});

                this.questions.splice(position, 0, question);
                // WTF here???
                Vue.set(this.itemData, 'questions', this.questions);

                $('.e-question-loop.new-item').addClass('paused');
                this.$nextTick(function () {
                    this.focusNewQuestion();
                    $('.e-question-loop.new-item').removeClass('paused');

                    if (this.questions.length === 1) {
                        this.redraw();
                        this.$('.question-loop-title').val('').focus();
                    }
                });
            },
            addQuestions: function (question, $ref) {
                var position = this.questions.length,
                    itemData = null,
                    defaultData = this.getDefaultQuestionData();

                if ($ref) {
                    position = this.getQuestionPosition($ref) + 1;
                }

                if ($.isArray(question)) {
                    for (var n = question.length, i = n - 1; i >= 0; i--) {
                        itemData = $.extend({}, defaultData, {
                            id: question[i].id,
                            title: question[i].title,
                            type: question[i].type
                        });

                        this.questions.splice(position, 0, itemData);
                    }
                } else {
                    this.questions.splice(position, 0, $.extend({}, defaultData, {
                        id: question.id,
                        title: question.title,
                        type: question.type
                    }));

                    question = [question];
                }
                this.$dispatch('addQuestions', {
                    quiz_ID: this.itemData.id,
                    questions: question.listPluck('id')
                }).then($.proxy(function (r) {
                    if (r.questions) {
                        var id = '';
                        for (var i = 0, n = this.questions.length; i < n; i++) {
                            id = this.questions[i].id;
                            if (r.questions[id] !== undefined) {
                                this.questions[i].answers = r.questions[id].answers;
                                this.questions[i].type = r.questions[id].type;
                            }
                        }
                    }
                }, this));
            },
            getDefaultQuestionData: function () {
                return {
                    id: 0,
                    content: '',
                    answers: [],
                    type: 'single_choice',
                    order: 0
                }
            },
            getQuestionPosition: function ($question) {
                var position = -1;

                if ($question) {
                    for (i in this.questions) {
                        if (this.questions[i].id == $question.question.id) {
                            position = parseInt(i);
                            break;
                        }
                    }
                }
                return position;
            },
            focusNewQuestion: function () {
                $(this.$el).find('[data-id="' + this.newQuestionID + '"] .question-loop-title').focus();
            },
            _onKeydownQuestionTitle: function (args) {
                var keyboard = FE_Helpers.getKeyboard(args[0]),
                    $question = $(args[0].target).closest('.e-question-loop'),
                    $questions = $question.parent().children(),
                    position = $questions.index($question);

                switch (keyboard.code) {
                    case 13:
                        args[0].preventDefault();
                        if (!args[1].question.title) {
                            return;
                        }
                        if (args[1] && args[1].placeholder) {
                            this.addQuestion(position + 1, {
                                title: args[1].$('.question-loop-title').val(),
                                type: args[1].question.type
                            });

                            FE_Helpers.debounce(function ($vm) {
                                args[1].$('.question-loop-title').val('').focus();
                            }, 30)(args[1]);

                        } else {
                            this.addQuestion(position + 1);
                        }
                        break;
                    case 38:
                    case 40:
                        args[0].preventDefault();
                        if (keyboard.code === 38) {
                            if (position === 0) {
                                position = $questions.length - 1;
                            } else {
                                position--;
                            }
                        } else {
                            if (position === $questions.length - 1) {
                                position = 0;
                            } else {
                                position++;
                            }
                        }

                        $questions.eq(position).find('.question-loop-title').focus();
                }
            },
            _select: function (args) {
                var $ref = null;
                if (args && args[1]) {
                    $ref = args[1];
                }
                this.$root.openModelSelectItems({
                    context: this,
                    postTypes: [{type: 'lp_question', name: 'Questions'}],
                    screen: 'lp_quiz',
                    screenID: this.itemData.id,
                    selectButton: FE_Localize.get('modal_select_question_button'),
                    modalTitle: FE_Localize.get('modal_select_question_title'),
                    select: function (args) {
                        if (args.items) {
                            var items = FE_Helpers.clone(args.items);

                            this.addQuestions(items, $ref)
                        }
                    },
                    exclude: function () {
                        return this.questions.listPluck('id')
                    }
                });
            },
            _updateQuestion: function (args) {
                var questionData = args.$vm.question;
                this.$dispatch('updateQuestion', {
                    quiz_ID: this.itemData.id,
                    context: args.context,
                    question: args.$vm.question
                }).then(function (r) {
                    if (r.result === 'success') {
                        if (r.id && args.$vm.question.id !== r.id) {
                            args.$vm.question.id = r.id;
                            Vue.set(args.$vm.question, 'answers', r.answers || []);
                        }
                    }
                });
            },
            /**
             * Emit callback from e-loop-question for _delete
             *
             * @param {MouseEvent} e        Mouse event happened on DOM.
             * @param {bool} trash          Move question to trash or only remove from quiz.
             * @param {Object} $vmQuestion  An instance of VueComponent for question.
             *
             * @private
             */
            _onDeleteQuestion: function (e, trash, $vmQuestion) {
                var $vm = this;

                this.$dispatch('removeQuestion', {
                    quiz_ID: this.itemData.id,
                    question_ID: $vmQuestion.question.id,
                    trash: trash
                }).then(function (r) {
                    if (r.result === 'success' && r.question_ID) {
                        var at = $vm.questions.findIndex(function (a) {
                            return a.id == r.question_ID;
                        });

                        $vm.questions.splice(at, 1);
                    }
                });
            },

            _changeDefaultQuestionType: function (type) {
                this.defaultQuestion.type = type;
            },

            _addNewQuestion: function (data) {
                this.addQuestion(this.questions.length + 1, data);

            },
            loadQuestion: function (id, r) {

            }

        })
    });

})(jQuery);