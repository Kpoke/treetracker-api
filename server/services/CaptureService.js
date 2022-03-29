const Capture = require('../models/Capture');
const Session = require('../database/Session');
const { dispatch } = require('../models/DomainEvent');
const { publishMessage } = require('./RabbitMQService');

class CaptureService {
  constructor() {
    this._session = new Session();
    this._capture = new Capture(this._session);
  }

  async getCaptures(filter, limitOptions) {
    return this._capture.getCaptures(filter, limitOptions);
  }

  async getCapturesCount(filter) {
    return this._capture.getCapturesCount(filter);
  }

  async getCaptureById(captureId) {
    return this._capture.getCaptureById(captureId);
  }

  async createCapture(captureObject) {
    try {
      await this._session.beginTransaction();
      const { capture, domainEvent, eventRepo } =
        await this._capture.createCapture(captureObject);

      await this._session.commitTransaction();

      if (domainEvent) {
        const eventDispatch = dispatch(eventRepo, publishMessage);
        eventDispatch('capture-created', domainEvent);
      }

      return capture;
    } catch (e) {
      if (this._session.isTransactionInProgress()) {
        await this._session.rollbackTransaction();
      }
      throw e;
    }
  }

  async updateCapture(captureObject) {
    try {
      await this._session.beginTransaction();
      const updatedCapture = await this._capture.updateCapture(captureObject);
      await this._session.commitTransaction();

      return updatedCapture;
    } catch (e) {
      if (this._session.isTransactionInProgress()) {
        await this._session.rollbackTransaction();
      }
      throw e;
    }
  }
}

module.exports = CaptureService;
