import { useEffect } from 'react';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'PromptFlow';

export const usePageTitle = (pageTitle?: string) => {
  useEffect(() => {
    if (pageTitle) {
      document.title = `${pageTitle} - ${APP_NAME}`;
    } else {
      document.title = APP_NAME;
    }
  }, [pageTitle]);
};

export default usePageTitle;