polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  entitiesThatExistInTS: Ember.computed.alias('details.entitiesThatExistInTS'),
  __message: '',
  __errorMessage: '',
  isRunning: '',
  actions: {
    deleteItem: function (intelId) {
      const outerThis = this;
      this.setMessage('');
      this.setRunning(true);
      this.get('block').notifyPropertyChange('data');

      this.sendIntegrationMessage({
        data: {
          action: 'deleteItem',
          intelId
        }
      })
        .then(({ newList }) => {
          outerThis.set('entitiesThatExistInTS', newList);
          outerThis.setMessage('Successfully Deleted IOC');
        })
        .catch((err) => {
          outerThis.setErrorMessage(
            'Failed to Delete IOC: ' + err.message || err.title || err.description || 'Unknown Reason'
          );
        })
        .finally(() => {
          outerThis.setRunning(false);
          outerThis.get('block').notifyPropertyChange('data');
        });
    }
  },

  setMessage(msg) {
    this.set('__message', msg);
  },

  setErrorMessage(msg) {
    this.set('__errorMessage', msg);
  },

  setRunning(isRunning) {
    this.set('isRunning', isRunning);
  }
});
