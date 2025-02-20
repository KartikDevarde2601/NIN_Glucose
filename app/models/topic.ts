import {
  getParent,
  Instance,
  SnapshotIn,
  SnapshotOut,
  types,
} from 'mobx-state-tree';
import {withSetPropAction} from './helpers/withSetPropAction';
import {sensorRepository} from '../op-sqllite/sensorRepository';
import {sensor_data} from '../op-sqllite/sensorRepository';

/**
 * Model description here for TypeScript hints.
 */
const sensor = new sensorRepository();

export interface rawdata {
  config: string;
  frequency: number;
  time: number;
  sensor_type: string;
  data: string;
}

export const TopicModel = types
  .model('Topic')
  .props({
    id: types.identifier,
    topicName: types.string,
    Issubscribed: types.optional(types.boolean, false),
    error: types.optional(types.string, ''),
    data: types.optional(types.string, ''),
  })
  .actions(withSetPropAction)
  .views(self => ({}))
  .actions(self => ({
    getTopicName() {
      return self.topicName;
    },
    deleteTopic() {
      const parent = getParent(self, 2) as {
        deleteTopic: (topic: Topic) => void;
      };
      parent.deleteTopic(self as Topic);
    },
    updateSubcriptionStats() {
      self.Issubscribed = !self.Issubscribed;
    },

    addMessage(
      message: rawdata,
      visit_id: string,
      interval_tag: number,
      interval: number,
    ) {
      const data: sensor_data = {
        visit_id: visit_id,
        interval_tag: interval_tag,
        interval: interval,
        config: message.config,
        frequency: message.frequency,
        time: message.time,
        sensor_type: message.sensor_type,
        data: message.data,
      };
      sensor.insertSensordata(data, self.topicName);
    },
    addError(error: string) {
      self.error = error;
    },
  }));

export interface Topic extends Instance<typeof TopicModel> {}
export interface TopicSnapshotOut extends SnapshotOut<typeof TopicModel> {}
export interface TopicSnapshotIn extends SnapshotIn<typeof TopicModel> {}
