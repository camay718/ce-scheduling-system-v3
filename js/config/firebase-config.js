/**
 * Firebase設定 - V3統合版（新プロジェクト対応・モジュラーSDK）
 * 
 * 役割:
 * - Firebase基本設定の提供とApp初期化
 * - グローバルインスタンスの管理
 * - 初期化完了Promise管理
 * - Firebase v9+ モジュラーSDK完全対応
 * 
 * 重要: 認証処理は各ページで明示的に実行（競合防止）
 */

// Firebase v9+ モジュラーSDK インポート（CDN使用）
import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js';

if (typeof window.firebaseV3Initialized === 'undefined') {
    console.log('🔄 Firebase V3設定ファイル読み込み開始');
    
    // Firebase設定（新プロジェクト: work-arrangement）
    window.firebaseConfig = {
        apiKey: "AIzaSyDHujcHnKS1IKxcp1rBmfL6zNiraRVv_Q0",
        authDomain: "work-arrangement.firebaseapp.com",
        databaseURL: "https://work-arrangement-default-rtdb.firebaseio.com",
        projectId: "work-arrangement",
        storageBucket: "work-arrangement.firebasestorage.app",
        messagingSenderId: "373524055304",
        appId: "1:373524055304:web:aaa68f970ef640384c58bd",
        measurementId: "G-XQ9ZS2FNC1"
    };

    // データルート（既存システムとの互換性を考慮）
    window.DATA_ROOT = window.DATA_ROOT || 'workArrangementV3';

    // グローバル変数
    window.app = null;
    window.auth = null;
    window.database = null;
    window.analytics = null;
    window.isFirebaseReady = false;
    window.firebaseV3Initialized = false;

    // Promise管理（初期化完了待機用）
    let initResolve, initReject, isResolved = false;
    window.firebaseInitPromise = new Promise((resolve, reject) => {
        initResolve = resolve;
        initReject = reject;
    });
    
    window.waitForFirebase = () => window.firebaseInitPromise;

    /**
     * Firebase基本初期化（認証なし）
     * モジュラーSDK使用・認証処理は各ページで明示的実行
     */
    async function initializeFirebaseV3() {
        if (window.firebaseV3Initialized) {
            if (!isResolved && initResolve) {
                isResolved = true;
                initResolve();
            }
            return;
        }
        
        try {
            // Firebase App初期化（冪等性保証）
            let app;
            if (getApps().length > 0) {
                app = getApp();
                console.log('✅ 既存Firebase App使用（V3）');
            } else {
                app = initializeApp(window.firebaseConfig);
                console.log('✅ Firebase App初期化完了（V3）');
            }
            
            // サービスインスタンス作成
            window.app = app;
            window.auth = getAuth(app);
            window.database = getDatabase(app);
            
            // Analytics初期化（ブラウザ対応チェック付き）
            try {
                const analyticsSupported = await isAnalyticsSupported();
                if (analyticsSupported && window.firebaseConfig.measurementId) {
                    window.analytics = getAnalytics(app);
                    console.log('📊 Firebase Analytics初期化完了（V3）');
                } else {
                    console.log('📊 Analytics非対応環境またはmeasurementId未設定のためスキップ');
                    window.analytics = null;
                }
            } catch (analyticsError) {
                console.warn('⚠️ Analytics初期化失敗:', analyticsError?.message || analyticsError);
                window.analytics = null;
            }
            
            // 接続状態監視（Realtime Database）
            try {
                const connectedRef = ref(window.database, '.info/connected');
                onValue(
                    connectedRef,
                    (snapshot) => {
                        window.isFirebaseReady = !!snapshot.val();
                        console.log(window.isFirebaseReady ? 
                            '✅ Firebase接続成功（V3）' : 
                            '❌ Firebase接続失敗（V3）'
                        );
                    },
                    (error) => {
                        console.warn('⚠️ Firebase接続監視エラー（V3）:', error?.message || error);
                        window.isFirebaseReady = false;
                    }
                );
            } catch (connectionError) {
                console.warn('⚠️ 接続監視設定失敗（V3）:', connectionError?.message || connectionError);
            }

            window.firebaseV3Initialized = true;

            // Promise解決
            if (!isResolved && initResolve) {
                isResolved = true;
                initResolve();
            }
            
        } catch (error) {
            console.error('❌ Firebase初期化エラー（V3）:', error);
            if (!isResolved && initReject) {
                isResolved = true;
                initReject(error);
            }
        }
    }

    // 即座に初期化実行
    initializeFirebaseV3();
    console.log('🔒 Firebase V3設定ファイル読み込み完了');
}
