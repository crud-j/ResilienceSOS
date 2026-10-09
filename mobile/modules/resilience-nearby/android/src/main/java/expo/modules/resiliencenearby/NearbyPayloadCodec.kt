package expo.modules.resiliencenearby

import org.json.JSONObject

/**
 * Encodes/decodes incident packets to/from UTF-8 JSON bytes.
 * All validation happens in the TypeScript layer before calling these methods.
 */
object NearbyPayloadCodec {

  fun encode(incidentJson: String): ByteArray = incidentJson.toByteArray(Charsets.UTF_8)

  fun decode(bytes: ByteArray): String = String(bytes, Charsets.UTF_8)

  /** Returns the size in bytes of the JSON string representation. */
  fun sizeBytes(incidentJson: String): Int = incidentJson.toByteArray(Charsets.UTF_8).size
}
