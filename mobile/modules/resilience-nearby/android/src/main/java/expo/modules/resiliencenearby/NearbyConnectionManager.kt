package expo.modules.resiliencenearby

import android.content.Context
import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.connection.*

typealias EventEmitter = (event: String, data: Map<String, Any?>) -> Unit

class NearbyConnectionManager(
  private val context: Context,
  private val emitEvent: EventEmitter
) {
  private val connectionsClient = Nearby.getConnectionsClient(context)

  // SERVICE_ID identifies this app to Nearby Connections; must match on all devices.
  private val serviceId = "com.resiliencesos.app.nearby"

  private val endpointDiscoveryCallback = object : EndpointDiscoveryCallback() {
    override fun onEndpointFound(endpointId: String, info: DiscoveredEndpointInfo) {
      emitEvent("onEndpointFound", mapOf(
        "endpointId" to endpointId,
        "endpointName" to info.endpointName,
        "serviceId" to info.serviceId
      ))
    }

    override fun onEndpointLost(endpointId: String) {
      emitEvent("onEndpointLost", mapOf("endpointId" to endpointId))
    }
  }

  private val connectionLifecycleCallback = object : ConnectionLifecycleCallback() {
    override fun onConnectionInitiated(endpointId: String, info: ConnectionInfo) {
      emitEvent("onConnectionInitiated", mapOf(
        "endpointId" to endpointId,
        "endpointName" to info.endpointName,
        "authenticationDigits" to info.authenticationDigits
      ))
    }

    override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {
      emitEvent("onConnectionResult", mapOf(
        "endpointId" to endpointId,
        "statusCode" to result.status.statusCode,
        "isSuccess" to result.status.isSuccess
      ))
    }

    override fun onDisconnected(endpointId: String) {
      emitEvent("onDisconnected", mapOf("endpointId" to endpointId))
    }
  }

  private val payloadCallback = object : PayloadCallback() {
    override fun onPayloadReceived(endpointId: String, payload: Payload) {
      val bytes = payload.asBytes()
      val text = bytes?.let { String(it, Charsets.UTF_8) } ?: ""
      emitEvent("onPayloadReceived", mapOf(
        "endpointId" to endpointId,
        "payloadId" to payload.id,
        "payload" to text
      ))
    }

    override fun onPayloadTransferUpdate(endpointId: String, update: PayloadTransferUpdate) {
      emitEvent("onPayloadTransferUpdate", mapOf(
        "endpointId" to endpointId,
        "payloadId" to update.payloadId,
        "status" to update.status,
        "bytesTransferred" to update.bytesTransferred,
        "totalBytes" to update.totalBytes
      ))
    }
  }

  fun startAdvertising(serviceId: String) {
    val options = AdvertisingOptions.Builder()
      .setStrategy(Strategy.P2P_CLUSTER)
      .build()

    connectionsClient.startAdvertising(
      android.os.Build.MODEL,
      serviceId,
      connectionLifecycleCallback,
      options
    ).addOnFailureListener { e ->
      emitEvent("onNearbyError", mapOf("operation" to "startAdvertising", "message" to (e.message ?: "unknown")))
    }
  }

  fun startDiscovery(serviceId: String) {
    val options = DiscoveryOptions.Builder()
      .setStrategy(Strategy.P2P_CLUSTER)
      .build()

    connectionsClient.startDiscovery(
      serviceId,
      endpointDiscoveryCallback,
      options
    ).addOnFailureListener { e ->
      emitEvent("onNearbyError", mapOf("operation" to "startDiscovery", "message" to (e.message ?: "unknown")))
    }
  }

  fun requestConnection(endpointId: String) {
    connectionsClient.requestConnection(
      android.os.Build.MODEL,
      endpointId,
      connectionLifecycleCallback
    ).addOnFailureListener { e ->
      emitEvent("onNearbyError", mapOf("operation" to "requestConnection", "endpointId" to endpointId, "message" to (e.message ?: "unknown")))
    }
  }

  fun acceptConnection(endpointId: String) {
    connectionsClient.acceptConnection(endpointId, payloadCallback)
      .addOnFailureListener { e ->
        emitEvent("onNearbyError", mapOf("operation" to "acceptConnection", "endpointId" to endpointId, "message" to (e.message ?: "unknown")))
      }
  }

  fun rejectConnection(endpointId: String) {
    connectionsClient.rejectConnection(endpointId)
  }

  fun sendPayload(endpointId: String, payloadText: String) {
    val bytes = payloadText.toByteArray(Charsets.UTF_8)
    val payload = Payload.fromBytes(bytes)
    connectionsClient.sendPayload(endpointId, payload)
      .addOnFailureListener { e ->
        emitEvent("onNearbyError", mapOf("operation" to "sendPayload", "endpointId" to endpointId, "message" to (e.message ?: "unknown")))
      }
  }

  fun disconnect(endpointId: String) {
    connectionsClient.disconnectFromEndpoint(endpointId)
  }

  fun stopAll() {
    connectionsClient.stopAllEndpoints()
    connectionsClient.stopAdvertising()
    connectionsClient.stopDiscovery()
  }
}
