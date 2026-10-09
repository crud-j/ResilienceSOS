package expo.modules.resiliencenearby

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.exception.Exceptions

class ResilienceNearbyModule : Module() {

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private var connectionManager: NearbyConnectionManager? = null

  override fun definition() = ModuleDefinition {
    Name("ResilienceNearby")

    // Events emitted to JavaScript
    Events(
      "onEndpointFound",
      "onEndpointLost",
      "onConnectionInitiated",
      "onConnectionResult",
      "onDisconnected",
      "onPayloadReceived",
      "onPayloadTransferUpdate",
      "onNearbyError"
    )

    AsyncFunction("checkPermissions") {
      NearbyPermissions.checkPermissions(context)
    }

    AsyncFunction("startAdvertising") { serviceId: String ->
      getManager().startAdvertising(serviceId)
    }

    AsyncFunction("startDiscovery") { serviceId: String ->
      getManager().startDiscovery(serviceId)
    }

    AsyncFunction("requestConnection") { endpointId: String ->
      getManager().requestConnection(endpointId)
    }

    AsyncFunction("acceptConnection") { endpointId: String ->
      getManager().acceptConnection(endpointId)
    }

    AsyncFunction("rejectConnection") { endpointId: String ->
      getManager().rejectConnection(endpointId)
    }

    AsyncFunction("sendPayload") { endpointId: String, payload: String ->
      getManager().sendPayload(endpointId, payload)
    }

    AsyncFunction("disconnect") { endpointId: String ->
      getManager().disconnect(endpointId)
    }

    AsyncFunction("stopAll") {
      connectionManager?.stopAll()
      connectionManager = null
    }

    OnCreate {
      connectionManager = NearbyConnectionManager(context) { event, data ->
        sendEvent(event, data)
      }
    }

    OnDestroy {
      connectionManager?.stopAll()
      connectionManager = null
    }
  }

  private fun getManager(): NearbyConnectionManager {
    return connectionManager
      ?: NearbyConnectionManager(context) { event, data -> sendEvent(event, data) }
        .also { connectionManager = it }
  }
}
