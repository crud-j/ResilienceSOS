package expo.modules.resiliencenearby

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat

object NearbyPermissions {

  /**
   * Returns a map of permission name → granted (Boolean).
   * The caller (JS) uses this to determine whether to request permissions.
   */
  fun checkPermissions(context: Context): Map<String, Boolean> {
    val required = mutableListOf(
      Manifest.permission.ACCESS_FINE_LOCATION
    )

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      required += listOf(
        Manifest.permission.BLUETOOTH_ADVERTISE,
        Manifest.permission.BLUETOOTH_CONNECT,
        Manifest.permission.BLUETOOTH_SCAN
      )
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      required += Manifest.permission.NEARBY_WIFI_DEVICES
    }

    return required.associateWith { permission ->
      ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
    }
  }
}
