polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  entitiesThatExistInTS: Ember.computed.alias('details.entitiesThatExistInTS'),
  notFoundEntities: Ember.computed.alias('details.notFoundEntities'),
  threatTypes: Ember.computed.alias('details.threatTypes'),
  orgTags: Ember.computed.alias('details.orgTags'),
  existingTags: [],
  isPublic: false,
  isAnonymous: false,
  manuallySetConfidence: false,
  newIocs: [],
  newIocsToSubmit: [],
  selectedTags: [{ name: 'Polarity' }],
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
    this.set(
      'existingTags',
      this.get('orgTags').map((orgTag) => ({ name: orgTag }))
    );
    this.set('submitThreatType', this.threatTypes[0].type);
    this.set('newIocs', this.get('notFoundEntities').slice(1));
    this.set('newIocsToSubmit', this.get('notFoundEntities').slice(0, 1));
    this._super(...arguments);
  },
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
        this.get('selectedTags').filter((selectedTag) => selectedTag.name !== tagToDelete.name)
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
          resolve(outerThis.get('existingTags'));
        }
      });
    },
    addTag: function () {
      const selectedTag = this.get('selectedTag');
      const selectedTags = this.get('selectedTags');

      let isDuplicate = selectedTags.find(
        (tag) => tag.name.toLowerCase() === selectedTag.name.toLowerCase()
      );

      if (!isDuplicate) {
        this.set('selectedTags', selectedTags.concat(selectedTag));
      }
    }
  }
});
