polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  entitiesThatExistInTS: Ember.computed.alias('details.entitiesThatExistInTS'),
  notFoundEntities: Ember.computed.alias('details.notFoundEntities'),
  threatTypes: Ember.computed.alias('details.threatTypes'),
  isPublic: false,
  newIocs: [],
  newIocsToSubmit: [],
  initialTags: ['Polarity'],
  tagsErrorMessage: '',
  maxTagsInBlock: 10,
  deleteMessage: '',
  deleteErrorMessage: '',
  deleteIsRunning: '',
  createMessage: '',
  createErrorMessage: '',
  createIsRunning: '',
  submitThreatType: '',
  submitSeverity: '',

  // _searchTags: function (term, resolve, reject) {
  //   let self = this;

  //   this.sendIntegrationMessage({
  //     action: 'searchTags',
  //     term: term,
  //     exclude: []
  //   })
  //     .then((result) => {
  //       console.info(result);
  //       let tagMap = new Map();

  //       result.tags.forEach((tag) => {
  //         let tagNameLower = tag.name.toLowerCase();
  //         if (tagMap.has(tagNameLower)) {
  //           if (tag.isPreferred) {
  //             tagMap.set(tagNameLower, tag);
  //           }
  //         } else {
  //           tagMap.set(tagNameLower, tag);
  //         }
  //       });

  //       let dedupedTags = [...tagMap.values()];
  //       self.set('initialTags', dedupedTags);

  //       resolve(dedupedTags);
  //     })
  //     .catch((err) => {
  //       self._displayError(err);
  //       reject(err);
  //     });
  // },
  init() {
    this.set('newIocs', this.get('notFoundEntities').slice(1));
    this.set('newIocsToSubmit', this.get('notFoundEntities').slice(0, 1));
    this._super(...arguments);
  },
  actions: {
    deleteItem: function (entity) {
      const outerThis = this;
      outerThis.set('deleteMessage', '');
      outerThis.set('deleteErrorMessage', '');
      outerThis.set('deleteIsRunning', true);
      outerThis.get('block').notifyPropertyChange('data');

      outerThis
        .sendIntegrationMessage({
          data: {
            action: 'deleteItem',
            entity,
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
          outerThis.set('deleteIsRunning', false);
          outerThis.get('block').notifyPropertyChange('data');
          setTimeout(() => {
            outerThis.set('deleteMessage', '');
            outerThis.set('deleteErrorMessage', '');
            outerThis.get('block').notifyPropertyChange('data');
          }, 3000);
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
        }, 1500);
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
            submitTags: [],
            submitPublic: outerThis.get('isPublic'),
            submitSeverity: outerThis.get('submitSeverity'),
            submitThreatType: outerThis.get('submitThreatType')
          }
        })
        .then(({ entitiesThatExistInTS }) => {
          outerThis.set('entitiesThatExistInTS', entitiesThatExistInTS);
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
          }, 3000);
        });
    }
    // editTags: function (index) {
    //   this.toggleProperty(`__editTags`);
    //   this.get('block').notifyPropertyChange('data');
    // },
    // searchTags: function (term) {
    //   return new Ember.RSVP.Promise((resolve, reject) => {
    //     Ember.run.debounce(this, this._searchTags, term, resolve, reject, 600);
    //   });
    // },
    // addTag: function (observable, observableIndex) {
    //   let self = this;

    //   self.set(`intelligence.${observableIndex}.__addingTag`, true);
    //   self.get('block').notifyPropertyChange('data');

    //   // The payload can contain any properties as long as you send a javascript object literal (POJO)
    //   let payload = {
    //     action: 'ADD_TAG',
    //     observableId: observable.id,
    //     tag: observable.__selectedTag.name,
    //     tlp: observable.__selectedTagVisibility.value
    //   };

    //   // This is a utility method that will send the payload to the server where it will trigger the integration's `onMessage` method
    //   this.sendIntegrationMessage(payload)
    //     .then(function (result) {
    //       // We set the message property to the result of response.reply
    //       observable.__selectedTag = '';
    //       let tags = observable.tags;
    //       if (!Array.isArray(tags)) {
    //         tags = [];
    //       }

    //       let isDuplicate = tags.find((tag) => {
    //         return tag.name.toLowerCase() === result.tags[0].name.toLowerCase();
    //       });

    //       if (!isDuplicate) {
    //         tags.push(result.tags[0]);
    //       }

    //       self.set('intelligence.' + observableIndex + '.tags', tags);
    //       self.set('actionMessage', JSON.stringify(result, null, 4));
    //     })
    //     .catch(function (err) {
    //       self._displayError(err);
    //     })
    //     .finally(() => {
    //       self.set(`intelligence.${observableIndex}.__addingTag`, false);
    //       self.get('block').notifyPropertyChange('data');
    //     });
    // },
    // deleteTag: function (observable, tagId, observableIndex) {
    //   let self = this;

    //   this.set(`intelligence.${observableIndex}.__deletingTag`, true);
    //   this.get('block').notifyPropertyChange('data');

    //   // The payload can contain any properties as long as you send a javascript object literal (POJO)
    //   let payload = {
    //     action: 'DELETE_TAG',
    //     observableId: observable.id,
    //     tagId: tagId
    //   };

    //   // This is a utility method that will send the payload to the server where it will trigger the integration's `onMessage` method
    //   this.sendIntegrationMessage(payload)
    //     .then(function (result) {
    //       // We set the message property to the result of response.reply
    //       let updatedTags = observable.tags.filter((tag) => {
    //         return tag.id !== tagId;
    //       });
    //       self.set('intelligence.' + observableIndex + '.tags', updatedTags);

    //       self.set('actionMessage', JSON.stringify(result, null, 4));
    //     })
    //     .catch((err) => {
    //       self._displayError(err);
    //     })
    //     .finally(() => {
    //       self.set(`intelligence.${observableIndex}.__deletingTag`, false);
    //       self.get('block').notifyPropertyChange('data');
    //     });
    // }
  }
});
