package br.com.territorio.gestao;

import org.junit.Test;
import static org.junit.Assert.*;
import javax.crypto.AEADBadTagException;
import java.nio.charset.StandardCharsets;

public class PixPasswordCryptoTest {
    @Test public void roundTripAndRandomSalt() throws Exception {
        byte[] plain="chave-ficticia@exemplo.invalid".getBytes(StandardCharsets.UTF_8),salt=PixPasswordCrypto.random(32),iv=PixPasswordCrypto.random(12),aad="app|owner-one".getBytes(StandardCharsets.UTF_8);
        byte[] sealed=PixPasswordCrypto.seal(plain,"senha-de-exemplo".toCharArray(),salt,iv,aad,"PBKDF2WithHmacSHA256");
        assertArrayEquals(plain,PixPasswordCrypto.open(sealed,"senha-de-exemplo".toCharArray(),salt,iv,aad,"PBKDF2WithHmacSHA256"));
        assertFalse(java.util.Arrays.equals(salt,PixPasswordCrypto.random(32)));
    }
    @Test(expected=AEADBadTagException.class) public void wrongPasswordCannotOpen() throws Exception {
        byte[] salt=PixPasswordCrypto.random(32),iv=PixPasswordCrypto.random(12),aad="owner-one".getBytes(StandardCharsets.UTF_8);
        byte[] sealed=PixPasswordCrypto.seal(new byte[]{1,2,3},"senha-correta".toCharArray(),salt,iv,aad,"PBKDF2WithHmacSHA256");
        PixPasswordCrypto.open(sealed,"senha-incorreta".toCharArray(),salt,iv,aad,"PBKDF2WithHmacSHA256");
    }
    @Test(expected=AEADBadTagException.class) public void otherOwnerCannotOpen() throws Exception {
        byte[] salt=PixPasswordCrypto.random(32),iv=PixPasswordCrypto.random(12);
        byte[] sealed=PixPasswordCrypto.seal(new byte[]{1,2,3},"senha-correta".toCharArray(),salt,iv,"owner-one".getBytes(StandardCharsets.UTF_8),"PBKDF2WithHmacSHA256");
        PixPasswordCrypto.open(sealed,"senha-correta".toCharArray(),salt,iv,"owner-two".getBytes(StandardCharsets.UTF_8),"PBKDF2WithHmacSHA256");
    }
    @Test(expected=AEADBadTagException.class) public void corruptionCannotOpen() throws Exception {
        byte[] salt=PixPasswordCrypto.random(32),iv=PixPasswordCrypto.random(12),aad=new byte[]{4};
        byte[] sealed=PixPasswordCrypto.seal(new byte[]{1,2,3},"senha-correta".toCharArray(),salt,iv,aad,"PBKDF2WithHmacSHA256");sealed[0]^=1;
        PixPasswordCrypto.open(sealed,"senha-correta".toCharArray(),salt,iv,aad,"PBKDF2WithHmacSHA256");
    }
    @Test public void android7KdfIsStillAuthenticated() throws Exception {
        byte[] salt=PixPasswordCrypto.random(32),iv=PixPasswordCrypto.random(12),aad=new byte[]{1},plain=new byte[]{2};
        byte[] sealed=PixPasswordCrypto.seal(plain,"senha-correta".toCharArray(),salt,iv,aad,"PBKDF2WithHmacSHA1");
        assertArrayEquals(plain,PixPasswordCrypto.open(sealed,"senha-correta".toCharArray(),salt,iv,aad,"PBKDF2WithHmacSHA1"));
    }
}
