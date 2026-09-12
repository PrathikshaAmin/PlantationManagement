import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";

// NOTE: The backend does not yet expose a password-reset endpoint
// (only /register, /login, /logout, /me exist). This screen is wired
// up and ready to go — swap the TODO below for a real API call once
// a POST /api/auth/forgot-password endpoint is added.
export default function ForgotPasswordScreen({ navigation }) {
  const [identifier, setIdentifier] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!identifier) {
      Alert.alert("Missing info", "Enter your registered mobile number or email");
      return;
    }
    // TODO: await api.post("/auth/forgot-password", { identifier })
    setSubmitted(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      {submitted ? (
        <Text style={styles.subtitle}>
          If this endpoint were connected, a reset link/OTP would be sent to {identifier}.
          Contact your admin for now to reset your password manually.
        </Text>
      ) : (
        <>
          <Text style={styles.subtitle}>Enter your mobile number or email</Text>
          <TextInput style={styles.input} placeholder="Mobile number or email" value={identifier} onChangeText={setIdentifier} autoCapitalize="none" />
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Send reset instructions</Text>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Back to login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f4f7f3" },
  title: { fontSize: 24, fontWeight: "700", color: "#2f6d3c", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#667", textAlign: "center", marginBottom: 24 },
  input: { backgroundColor: "#fff", borderRadius: 8, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#ddd" },
  button: { backgroundColor: "#2f6d3c", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontWeight: "700" },
  link: { color: "#2f6d3c", textAlign: "center", marginTop: 16 },
});
