package br.com.territorio.gestao;
import java.util.concurrent.atomic.AtomicBoolean;
/** One app-owned model operation across the assistant and its diagnostic panel. */
final class LocalInferenceLease {
    static final AtomicBoolean BUSY = new AtomicBoolean(false);
    private LocalInferenceLease() {}
}
