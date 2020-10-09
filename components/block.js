polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  maxUniqueKeyNumber: Ember.computed.alias('details.maxUniqueKeyNumber'),
  isPublic: false,
  isAnonymous: false,
  manuallySetConfidence: false,
  orgTags: [],
  existingTags: [],
  threatTypes: [],
  entitiesThatExistInTS: [],
  newIocs: [],
  newIocsToSubmit: [],
  selectedTags: [{ name: 'Submitted_By_Polarity' }],
  tagsErrorMessage: '',
  maxTagsInBlock: 10,
  deleteMessage: '',
  deleteErrorMessage: '',
  deleteIsRunning: false,
  isDeleting: false,
  entityToDelete: {},
  createMessage: '',
  createErrorMessage: '',
  createIsRunning: false,
  submitThreatType: '',
  submitSeverity: 'low',
  submitConfidence: 50,
  TLP: 'red',
  selectedTag: '',
  editingTags: false,
  tagVisibility: [
    { name: 'Anomali Community', value: 'white' },
    { name: 'My Organization', value: 'red' }
  ],
  selectedTagVisibility: { name: 'My Organization', value: 'red' },
  interactionDisabled: Ember.computed('isDeleting', 'createIsRunning', function () {
    return this.get('isDeleting') || this.get('createIsRunning');
  }),
  init() {
    const threatTypes = this.get(`details.threatTypes${this.get('maxUniqueKeyNumber')}`);
    const orgTags = this.get(`details.orgTags${this.get('maxUniqueKeyNumber')}`);
    this.set('threatTypes', threatTypes);
    this.set('orgTags', orgTags);

    this.set(
      'existingTags',
      orgTags.map((orgTag) => ({
        name: orgTag
      }))
    );
    this.set('submitThreatType', threatTypes[0].type);

    this.set(
      'newIocs',
      this.get(`details.notFoundEntities${this.get('maxUniqueKeyNumber')}`)
    );

    this.set(
      'entitiesThatExistInTS',
      this.get(`details.entitiesThatExistInTS${this.get('maxUniqueKeyNumber')}`)
    );

    this._super(...arguments);
  },
  observer: Ember.on(
    'willUpdate',
    Ember.observer('details.maxUniqueKeyNumber', function () {
      if (this.get('maxUniqueKeyNumber') !== this.get('_maxUniqueKeyNumber')) {
        this.set('_maxUniqueKeyNumber', this.get('maxUniqueKeyNumber'));
        this.set(
          'newIocs',
          this.get(`details.notFoundEntities${this.get('maxUniqueKeyNumber')}`)
        );
        this.set(
          'entitiesThatExistInTS',
          this.get(`details.entitiesThatExistInTS${this.get('maxUniqueKeyNumber')}`)
        );

        const threatTypes = this.get(
          `details.threatTypes${this.get('maxUniqueKeyNumber')}`
        );
        const orgTags = this.get(`details.orgTags${this.get('maxUniqueKeyNumber')}`);

        this.set('threatTypes', threatTypes);
        this.set('orgTags', orgTags);
        this.set(
          'existingTags',
          orgTags.map((orgTag) => ({
            name: orgTag
          }))
        );
        this.set('submitThreatType', threatTypes[0].type);

        this.set('newIocsToSubmit', []);
      }
    })
  ),
  actions: {
    initiateItemDeletion: function (entity) {
      this.set('isDeleting', true);
      this.set('entityToDelete', entity);
    },
    cancelItemDeletion: function () {
      this.set('isDeleting', false);
      this.set('entityToDelete', {});
    },
    confirmDelete: function () {
      const outerThis = this;
      outerThis.set('deleteMessage', '');
      outerThis.set('deleteErrorMessage', '');
      outerThis.set('deleteIsRunning', true);
      outerThis.get('block').notifyPropertyChange('data');

      outerThis
        .sendIntegrationMessage({
          data: {
            action: 'deleteItem',
            entity: outerThis.get('entityToDelete'),
            newIocs: outerThis.get('newIocs'),
            intelObjects: outerThis.get('entitiesThatExistInTS')
          }
        })
        .then(({ newIocs, newList }) => {
          outerThis.set('newIocs', newIocs);
          outerThis.set('entitiesThatExistInTS', newList);
          outerThis.set('deleteMessage', 'Successfully Deleted IOC');
        })
        .catch((err) => {
          outerThis.set(
            'deleteErrorMessage',
            'Failed to Delete IOC: ' +
              (err &&
                (err.detail || err.err || err.message || err.title || err.description)) ||
              'Unknown Reason'
          );
        })
        .finally(() => {
          this.set('isDeleting', false);
          this.set('entityToDelete', {});
          outerThis.set('deleteIsRunning', false);
          outerThis.get('block').notifyPropertyChange('data');
          setTimeout(() => {
            outerThis.set('deleteMessage', '');
            outerThis.set('deleteErrorMessage', '');
            outerThis.get('block').notifyPropertyChange('data');
          }, 5000);
        });
    },
    removeAllSubmitItems: function () {
      const allIOCs = this.get('newIocs').concat(this.get('newIocsToSubmit'));

      this.set('newIocs', allIOCs);
      this.set('newIocsToSubmit', []);

      this.updateCategorySubmitDisabled([]);
      this.get('block').notifyPropertyChange('data');
    },
    addAllSubmitItems: function () {
      const allIOCs = this.get('newIocs').concat(this.get('newIocsToSubmit'));

      this.set('newIocs', []);
      this.set('newIocsToSubmit', allIOCs);

      this.updateCategorySubmitDisabled(allIOCs);
      this.get('block').notifyPropertyChange('data');
    },
    removeSubmitItem: function (entity) {
      this.set('newIocs', this.get('newIocs').concat(entity));
      this.set(
        'newIocsToSubmit',
        this.get('newIocsToSubmit').filter(({ value }) => value !== entity.value)
      );
      this.get('block').notifyPropertyChange('data');
    },
    addSubmitItem: function (entity) {
      this.set(
        'newIocs',
        this.get('newIocs').filter(({ value }) => value !== entity.value)
      );
      this.set('newIocsToSubmit', this.get('newIocsToSubmit').concat(entity));
      this.get('block').notifyPropertyChange('data');
    },
    submitItems: function () {
      const outerThis = this;
      const possibleParamErrors = [
        {
          condition: () => !outerThis.get('newIocsToSubmit').length,
          message: 'No Items to Submit...'
        },
        {
          condition: () => !outerThis.get('submitThreatType'),
          message: 'Must Select a Threat Type...'
        }
      ];

      const paramErrorMessages = possibleParamErrors.reduce(
        (agg, possibleParamError) =>
          possibleParamError.condition() ? agg.concat(possibleParamError.message) : agg,
        []
      );

      if (paramErrorMessages.length) {
        outerThis.set('createErrorMessage', paramErrorMessages[0]);
        outerThis.get('block').notifyPropertyChange('data');
        setTimeout(() => {
          outerThis.set('createErrorMessage', '');
          outerThis.get('block').notifyPropertyChange('data');
        }, 5000);
        return;
      }

      outerThis.set('createMessage', '');
      outerThis.set('createErrorMessage', '');
      outerThis.set('createIsRunning', true);
      outerThis.get('block').notifyPropertyChange('data');
      outerThis
        .sendIntegrationMessage({
          data: {
            action: 'submitItems',
            newIocsToSubmit: outerThis.get('newIocsToSubmit'),
            previousEntitiesInTS: outerThis.get('entitiesThatExistInTS'),
            submitPublic: outerThis.get('isPublic'),
            isAnonymous: outerThis.get('isAnonymous'),
            submitConfidence: outerThis.get('submitConfidence'),
            manuallySetConfidence: outerThis.get('manuallySetConfidence'),
            TLP: outerThis.get('TLP'),
            submitSeverity: outerThis.get('submitSeverity'),
            submitThreatType: outerThis.get('submitThreatType'),
            submitTags: outerThis
              .get('selectedTags')
              .map((selectedTag) => selectedTag.name),
            orgTags: outerThis.get('orgTags'),
            selectedTagVisibility: outerThis.get('selectedTagVisibility')
          }
        })
        .then(({ entitiesThatExistInTS, orgTags }) => {
          outerThis.set('entitiesThatExistInTS', entitiesThatExistInTS);
          outerThis.set('orgTags', orgTags);
          outerThis.set('newIocsToSubmit', []);
          outerThis.set('createMessage', 'Successfully Created IOCs');
        })
        .catch((err) => {
          outerThis.set(
            'createErrorMessage',
            'Failed to Create IOC: ' +
              (err && (err.message || err.title || err.description)) || 'Unknown Reason'
          );
        })
        .finally(() => {
          outerThis.set('createIsRunning', false);
          outerThis.get('block').notifyPropertyChange('data');
          setTimeout(() => {
            outerThis.set('createMessage', '');
            outerThis.set('createErrorMessage', '');
            outerThis.get('block').notifyPropertyChange('data');
          }, 5000);
        });
    },
    editTags: function () {
      this.toggleProperty(`editingTags`);
      this.get('block').notifyPropertyChange('data');
    },
    deleteTag: function (tagToDelete) {
      this.set(
        'selectedTags',
        this.get('selectedTags').filter(
          (selectedTag) => selectedTag.name !== tagToDelete.name
        )
      );
    },
    searchTags: function (term) {
      const outerThis = this;
      return new Ember.RSVP.Promise((resolve, reject) => {
        if (term) {
          const tags = outerThis
            .get('orgTags')
            .filter((orgTag) => orgTag.toLowerCase().includes(term.toLowerCase()))
            .map((orgTag) => ({ name: orgTag }));

          resolve([{ name: term, isNew: true }].concat(tags));
        } else {
          const newExistingTags = outerThis
            .get('orgTags')
            .filter(
              (orgTag) =>
                !this.get('selectedTags').some(
                  (_selectedTag) =>
                    _selectedTag.name.toLowerCase().trim() === orgTag.toLowerCase().trim()
                )
            );
          outerThis.set('existingTags', newExistingTags);
          resolve(newExistingTags);
        }
      });
    },
    addTag: function () {
      const selectedTag = this.get('selectedTag');
      const selectedTags = this.get('selectedTags');

      let isDuplicate = selectedTags.some(
        (tag) => tag.name.toLowerCase() === selectedTag.name.toLowerCase()
      );

      if (!isDuplicate) {
        this.set('selectedTag', '');
        this.set('selectedTags', selectedTags.concat(selectedTag));
      }
    }
  }
});
