package com.tbankpremium.app;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;
import android.net.Uri;
import android.os.Build;
import android.app.PendingIntent;
import android.provider.Settings;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Проверка и установка обновлений из GitHub Releases.
 * Установка идёт ПОВЕРХ текущей версии (PackageInstaller), данные приложения сохраняются.
 */
class Updater {

    interface Js { void run(String code); }

    static Updater current;

    private final Context ctx;
    private final Js js;
    private volatile String assetUrl;
    private volatile long assetSize;
    private volatile boolean busy;

    Updater(Context ctx, Js js) {
        this.ctx = ctx.getApplicationContext();
        this.js = js;
        current = this;
    }

    // ---------- проверка ----------
    void check() {
        new Thread(() -> {
            try {
                String repo = BuildConfig.REPO;
                if (repo.startsWith("OWNER")) {
                    sendCheck("error", null, null, 0, "Репозиторий не задан (сборка не через GitHub Actions)");
                    return;
                }
                HttpURLConnection c = open("https://api.github.com/repos/" + repo + "/releases/latest");
                c.setRequestProperty("Accept", "application/vnd.github+json");
                int code = c.getResponseCode();
                if (code == 404) { sendCheck("latest", null, null, 0, null); return; }
                if (code != 200) { sendCheck("error", null, null, 0, "GitHub ответил кодом " + code); return; }
                JSONObject j = new JSONObject(readAll(c.getInputStream()));
                String tag = j.optString("tag_name", "");
                String digits = tag.replaceAll("[^0-9]", "");
                int remote = digits.isEmpty() ? 0 : Integer.parseInt(digits);
                String name = j.optString("name", tag);
                if (name.isEmpty()) name = tag;
                String notes = j.optString("body", "");
                if (notes.length() > 700) notes = notes.substring(0, 700) + "…";

                assetUrl = null; assetSize = 0;
                JSONArray assets = j.optJSONArray("assets");
                if (assets != null) {
                    for (int i = 0; i < assets.length(); i++) {
                        JSONObject a = assets.getJSONObject(i);
                        if (a.optString("name").toLowerCase().endsWith(".apk")) {
                            assetUrl = a.optString("browser_download_url");
                            assetSize = a.optLong("size");
                            break;
                        }
                    }
                }
                if (remote > BuildConfig.VERSION_CODE && assetUrl != null) {
                    sendCheck("available", name, notes, assetSize, null);
                } else {
                    sendCheck("latest", name, null, 0, null);
                }
            } catch (Exception e) {
                sendCheck("error", null, null, 0, "Нет соединения с GitHub");
            }
        }).start();
    }

    private void sendCheck(String status, String name, String notes, long size, String message) {
        try {
            JSONObject o = new JSONObject();
            o.put("status", status);
            o.put("versionName", name == null ? "" : name);
            o.put("notes", notes == null ? "" : notes);
            o.put("size", size);
            o.put("message", message == null ? "" : message);
            js.run("window.onUpdateCheck(" + o.toString() + ")");
        } catch (Exception ignored) { }
    }

    // ---------- загрузка ----------
    void download() {
        if (assetUrl == null) { state("error", "Файл обновления не найден"); return; }
        if (!ctx.getPackageManager().canRequestPackageInstalls()) {
            try {
                Intent i = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + ctx.getPackageName()));
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(i);
            } catch (Exception ignored) { }
            state("perm", "");
            return;
        }
        if (busy) return;
        busy = true;
        final String url = assetUrl;
        new Thread(() -> {
            File f = new File(ctx.getCacheDir(), "update.apk");
            try {
                HttpURLConnection c = open(url);
                c.setRequestProperty("Accept-Encoding", "identity");
                c.setInstanceFollowRedirects(true);
                if (c.getResponseCode() != 200) throw new RuntimeException("HTTP " + c.getResponseCode());
                long total = c.getContentLengthLong();
                if (total <= 0) total = assetSize;
                int last = -1;
                try (InputStream in = c.getInputStream(); OutputStream out = new FileOutputStream(f)) {
                    byte[] buf = new byte[64 * 1024];
                    long done = 0; int n;
                    while ((n = in.read(buf)) > 0) {
                        out.write(buf, 0, n);
                        done += n;
                        if (total > 0) {
                            int pct = (int) (done * 100 / total);
                            if (pct != last) { last = pct; js.run("window.onUpdateProgress(" + pct + ")"); }
                        }
                    }
                }
                state("installing", "");
                install(f);
            } catch (Exception e) {
                state("error", "Не удалось скачать обновление");
            } finally {
                busy = false;
            }
        }).start();
    }

    // ---------- установка поверх ----------
    private void install(File apk) throws Exception {
        PackageInstaller pi = ctx.getPackageManager().getPackageInstaller();
        PackageInstaller.SessionParams p =
                new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
        if (Build.VERSION.SDK_INT >= 31) {
            p.setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_NOT_REQUIRED);
        }
        int id = pi.createSession(p);
        try (PackageInstaller.Session s = pi.openSession(id)) {
            try (InputStream in = new FileInputStream(apk);
                 OutputStream out = s.openWrite("app.apk", 0, apk.length())) {
                byte[] buf = new byte[64 * 1024];
                int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                s.fsync(out);
            }
            Intent i = new Intent(ctx, InstallReceiver.class);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= 31) flags |= PendingIntent.FLAG_MUTABLE;
            PendingIntent pend = PendingIntent.getBroadcast(ctx, id, i, flags);
            s.commit(pend.getIntentSender());
        }
    }

    void state(String s, String msg) {
        try {
            js.run("window.onUpdateState(" + JSONObject.quote(s) + "," + JSONObject.quote(msg == null ? "" : msg) + ")");
        } catch (Exception ignored) { }
    }

    // ---------- утилиты ----------
    private static HttpURLConnection open(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(15000);
        c.setReadTimeout(30000);
        c.setRequestProperty("User-Agent", "TBankPremium-Updater");
        return c;
    }

    private static String readAll(InputStream in) throws Exception {
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
        in.close();
        return bo.toString("UTF-8");
    }
}
