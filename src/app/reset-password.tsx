// src/app/reset-password.tsx
import { useRouter } from 'expo-router';

import OtpRequestScreen from '@/components/common/OtpRequestScreen';

import { useLanguage } from '@/context/LanguageContext';
import { sendPasswordOtp } from '@/services/credentials/credentialsService';

export default function ResetPasswordScreen() {
    const router = useRouter();
    const { t } = useLanguage();

    return (
        <OtpRequestScreen
            title={t('resetPassword')}
            send={() => sendPasswordOtp()}
            onSent={(mobile) =>
                router.push({
                    pathname: '/update-password',
                    params: { mobile },
                })
            }
        />
    );
}
