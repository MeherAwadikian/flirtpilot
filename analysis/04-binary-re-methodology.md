# 04 — iOS Binary RE Methodology (runnable; pending IPA)

The IPA is **not available in this environment** (no Apple device/account), so this is a
**runnable procedure**, not results. Installed tools live under `E:\reverse-engineering\`:
`ghidra`, `cutter`, `retdec`, `frida` (`jadx` = Android, N/A here).

Because REF is a Lovable **web app in a native shell**, expect the Mach-O to be thin: a
WKWebView/Capacitor host + RevenueCat + the keyboard extension. The high-value targets are
(a) confirming the shell type, (b) the keyboard↔app **App Group** token storage, and
(c) any native string/endpoint the web layer doesn't expose.

## Step 0 — Obtain and decrypt the IPA (needs a real device)
App Store binaries are FairPlay-encrypted; you must decrypt on-device.
```bash
# On a jailbroken iPhone (frida-ios-dump is the common path):
pip install frida-tools
git clone https://github.com/AloneMonkey/frida-ios-dump
# install REF from the App Store first, then:
python3 dump.py -o REF.ipa "REF: Dating Coach"     # pulls a decrypted IPA
# Non-jailbroken alt: a dev-signed sideload + a decrypt tweak, or a MobileSubstrate-free
# userland decryptor. Document whichever you use.
unzip -o REF.ipa -d REF_ipa
BIN="REF_ipa/Payload/REF.app/REF"                  # main Mach-O
```
Sanity-check it is decrypted (cryptid must be 0):
```bash
otool -l "$BIN" | grep -A4 LC_ENCRYPTION_INFO      # cryptid 0 = decrypted
file "$BIN"; lipo -info "$BIN"                      # arch(es)
```

## Step 1 — Triage strings & structure
```bash
strings -a "$BIN" | grep -Ei 'supabase|functions/v1|lovable|revenuecat|keyboard-token|coaching-ai|appgroup|group\.' | sort -u
otool -L "$BIN"            # linked frameworks (WebKit? Capacitor? RevenueCat?)
```
Confirms the shell type and whether any endpoint/App-Group id is baked natively.

## Step 2 — Ghidra (static decompile)
`E:\reverse-engineering\ghidra` — headless analyzer:
```bash
cd /e/reverse-engineering/ghidra
./support/analyzeHeadless /e/reverse-engineering/ref-dating-coach/ghidra_proj REF \
  -import "/path/REF_ipa/Payload/REF.app/REF" \
  -scriptPath . -postScript ExportStrings.java   # or open in GUI: ./ghidraRun
```
Focus: Objective-C/Swift class dump, the keyboard extension binary
(`Payload/REF.app/PlugIns/*.appex/*`), and any `NSUserDefaults(suiteName: group.*)` access
(the shared App Group where the keyboard token lives).

## Step 3 — retdec (optional second decompiler)
`E:\reverse-engineering\retdec` — good for a quick C-ish view of a specific function:
```bash
/e/reverse-engineering/retdec/bin/retdec-decompiler "$BIN" -o REF.c   # whole-binary; slow
```
(Cutter `E:\reverse-engineering\cutter` is the GUI alternative for interactive triage.)

## Step 4 — Frida (dynamic — the real payoff)
`E:\reverse-engineering\frida`. On a device with frida-server running:
```bash
pip install frida-tools
frida-ps -Uai | grep -i ref                        # find the app
```
Hook the network + keyboard-token storage:
```js
// trace.js — log every outbound URL + body, and App Group reads
if (ObjC.available) {
  const Session = ObjC.classes.NSURLSession;
  Interceptor.attach(Session['- dataTaskWithRequest:completionHandler:'].implementation, {
    onEnter(args) {
      const req = new ObjC.Object(args[2]);
      console.log('[URL]', req.URL().absoluteString().toString());
      const b = req.HTTPBody();
      if (b && !b.isNull()) console.log('[BODY]', ObjC.classes.NSString.alloc()
        .initWithData_encoding_(b, 4).toString());
    }
  });
  // observe the shared App Group / keyboard token
  const UD = ObjC.classes.NSUserDefaults;
  Interceptor.attach(UD['- initWithSuiteName:'].implementation, {
    onEnter(a){ console.log('[AppGroup]', new ObjC.Object(a[2]).toString()); }
  });
}
```
```bash
frida -U -f app.lovable.p5273e8dc9c364c499a079ade87f87a3c -l trace.js --no-pause
```
Expected captures: the live `*.supabase.co` project URL, the anon `apikey` header, the
`keyboard-token` issue/revoke payloads, and the exact `coaching-ai` request schema — the
three things `03` marks UNKNOWN.

## Step 5 — Keyboard extension specifics
- Dump the `.appex` Mach-O (Step 2 path) separately; it's the least-privilege client.
- Find the App Group id (`group.app.lovable.*` or similar) from Step 1/4 — that's the
  app↔extension shared container holding the issued token.
- Verify "typing works without Full Access": the extension should gate all network calls
  (coaching/icebreakers) behind `hasFullAccess`.

## Deliverable when done
Fill `analysis/03` UNKNOWN rows with OBSERVED values (minus secrets), and append a
`05-binary-findings.md` with the shell type, App Group id, and native endpoint confirmation.
