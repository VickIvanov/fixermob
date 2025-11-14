import {NativeModules, Platform} from 'react-native';

const {PdfViewerModule} = NativeModules;

const PdfViewerService = {
  async openPdf(filePath) {
    if (Platform.OS === 'android' && PdfViewerModule) {
      return await PdfViewerModule.openPdf(filePath);
    } else {
      throw new Error('PDF viewer is only available on Android');
    }
  },
};

export default PdfViewerService;

