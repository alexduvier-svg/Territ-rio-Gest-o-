package br.com.territorio.gestao;
import android.content.Context;
import android.content.Intent;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;
import java.io.*;
// Synthetic file only. Does not launch the ERP, read its database, or create any business record.
@RunWith(AndroidJUnit4.class)
public class DocumentsInstrumentedTest {
 @Test public void pdfUsesReadableContentURIAndTemporaryGrant() throws Exception {
  Context c=InstrumentationRegistry.getInstrumentation().getTargetContext();
  File dir=new File(c.getCacheDir(),"compartilhar");assertTrue(dir.exists()||dir.mkdirs());
  File f=new File(dir,"qa-uri-synthetic.pdf");byte[] payload="%PDF-1.7\nsynthetic URI transport test\n%%EOF".getBytes("UTF-8");
  try{try(FileOutputStream out=new FileOutputStream(f)){out.write(payload);}
   Intent view=AgroDocumentsPlugin.previewIntent(c,f);assertEquals(Intent.ACTION_VIEW,view.getAction());assertEquals("application/pdf",view.getType());assertEquals("content",view.getData().getScheme());assertEquals(c.getPackageName()+".fileprovider",view.getData().getAuthority());assertTrue((view.getFlags()&Intent.FLAG_GRANT_READ_URI_PERMISSION)!=0);
   try(InputStream in=c.getContentResolver().openInputStream(view.getData())){ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[1024];int n;while((n=in.read(b))!=-1)out.write(b,0,n);assertArrayEquals(payload,out.toByteArray());}
  }finally{assertTrue(f.delete());}
 }
}
