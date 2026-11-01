import { Alert } from '@/services/alert';

export const alertNotSaved = () => {
  Alert.alert('Not saved', 'Could not save this change. Check your connection and try again.');
};
