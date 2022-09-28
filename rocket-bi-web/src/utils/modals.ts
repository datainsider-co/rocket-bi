import ConfirmationModal, { ModalCallback } from '@/screens/Confirmation/view/ConfirmationModal.vue';
import { Log } from '@core/utils/Log';
import { PopupUtils } from '@/utils/popup.utils';

export class Modals {
  private static confirmationModal?: ConfirmationModal;

  static init(confirmationModal?: ConfirmationModal) {
    Modals.confirmationModal = confirmationModal;
    Log.debug('Confirmmodal::', Modals.confirmationModal);
  }

  static showConfirmationModal(message: string, modalCallback?: ModalCallback) {
    if (Modals.confirmationModal) {
      Modals.confirmationModal?.show(message, modalCallback);
    } else {
      Log.error('ConfirmationUtils::show::confirmationModal null');
    }
    //
  }
}
