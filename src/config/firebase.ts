import admin from "firebase-admin";

const serviceAccount = {
  type: "service_account",
  project_id: "dinknutrition-7643e",
  private_key_id: "c54f8143e0d1e355b7abf97873b1ca2994effdcf",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCnDJFBPTCSgGjT\nFm70lMgijCYzr7t0Gj8Vpj4HOAB9tQiJGVqQIlwHFJSmnFWNee70lo2oTiUUm8JC\nX99YPJf+7hNAyH892Y7WFfc++jGNvHaTOyP0ZMyKw51vGDfTlxftSoV06hnXLHhQ\nqNb0+OqZzBlAKBT9mj1PDObi9f0TFHd0WqQxp3A6pJHCceETtlcjkP9bKp+Q/4kp\n5iXNMSZG4G0drhbCnfXdukaKpJpCEMCytv3SASeUh9HXSfHG6ZZIJ1fAus5K2wrk\nFxh7guq84+cCyr9l8pwe98j3HghWztViFE8t4OKqL0IJTvQjHF3yGoughCprV7jv\n2J7zA8NfAgMBAAECggEAAqqKrvXhDpWKFsRm5PRy9UozWePWJBY/J4NNviPArkDz\nb+y9q0tBGMPVU4tvOiDWFYVJoYQNx3Rs9048bFYbPvBh0kjg7wXH59bV6WVo4RA+\n/D6XZlEtipFws9M5IOFqelkUJDeQTgThrrfjJmnKpMXDKWj6XMnXbKmSDdFLRsCo\nRExFOnjk7DDGD588Zrtrbmj0i0PC9rt6/EeUm0o9vgReobEeT5cbN4zX0QVLS3cp\nkcMkSD5zc0gLqSCvQCCjhf3RxecOXh2s0GVPHwjFNNkjlmrkVc61h659RDrW5x5R\nznutKTyYLye/F4U+c5iBda6xEvkY+qSN9wtZUJXVUQKBgQDWzAQrflSfRAU/59dh\ntG7x6GrnB9RcK8ZAzt/Juept+wlIr7MYWE1uJZgnTkLZfj72EDV41rVyrhtRtezX\nw3ZJC9fNyRQOk0u6NjOdNMjIaWufHxKlXqwfKgLgTbWn1ivLangDSurZeffPUGUi\nCNySYjD2xJtn+Zbk+pPKaIhsrQKBgQDHF88AGxBlAu8LRXunhIYCZaOoq16HUBE2\nyvplKZXDfb2Hx539wJs5Pb9mu92D4g479/3WYuMILYW5HN+zgzuWA7EA+t/zzhDM\n/aTyIwV0pxZHBOL99OirXLj1s6kzevQRHPAV0eOTxgP96kTfHPOquICllWGseyrl\nrXuQhNEFuwKBgD9UueoE/nhS+uVDuzpgk9GZgGOL6G4grfyPwmXc/iTdPniC7WBB\nMNtIFFuKdKVh1riAQPPXAnrEoONvq1xWkjqpVkCjh9lgTpShxIgWdxi4FHY/GCVQ\nC5nIrj5qSyQoPpNkWexGm4Xxs0IZ5yeoyzgR4XPwtg1rBrWOuCKWvZqlAoGADkKA\nSwulMvbw1CfX4Xm2d3l8LVqI3Lw5X2lOYeyGk4fwCUec403mUEVB7kPKa+XHCziJ\n788JX86S411UEHF31RjSlrVhUP8TaPtJ0yX7AA3vpIqPD415FL0BamfB2LQXwxoF\ngCqWWEE4i/k5kZlrQnEQlcuLQWVY/zZbwVAiAH0CgYAIH7TOQvC+7n1NYK36l/Au\nW8jPG5UCUk5GRsHlqRkL6VoXgBGVyFme+eerkI8TFtzrJw/RwLZEnuHYJBxEQ4Dz\nNbQ5b9Oa/OgfSE5JZ8hnQ52SHTyFzRSplv95DA1xZEKBW90Ft54lqdVCx6gj5Vqs\nIAYw50bbwEDW0uX8K6ecfA==\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-fbsvc@dinknutrition-7643e.iam.gserviceaccount.com",
  client_id: "100238170796580262897",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url:
    "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40dinknutrition-7643e.iam.gserviceaccount.com",
  universe_domain: "googleapis.com",
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  projectId: serviceAccount.project_id,
});

export default admin;
