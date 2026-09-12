import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import api from "../../api/client";

const empty = {
  farmerName: "", mobileNumber: "", alternateMobileNumber: "",
  gender: "", dateOfBirth: "",
  address: { village: "", taluk: "", district: "", state: "", pinCode: "" },
  primaryOccupation: "", farmingExperienceYears: "",
};

export default function FarmerFormScreen({ route, navigation }) {
  const id = route.params?.id;
  const isEdit = Boolean(id);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/farmers/${id}`).then((res) => {
        const f = res.data.data;
        setForm({ ...empty, ...f, address: { ...empty.address, ...f.address } });
      });
    }
  }, [id]);

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const setAddr = (field, value) => setForm((f) => ({ ...f, address: { ...f.address, [field]: value } }));

  const handleSave = async () => {
    if (!form.farmerName || !form.mobileNumber) {
      Alert.alert("Missing info", "Farmer name and mobile number are required");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/farmers/${id}`, form);
      } else {
        await api.post("/farmers", form);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert("Save failed", err.response?.data?.message || "Please try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.section}>Personal Information</Text>
      <Input label="Farmer Name *" value={form.farmerName} onChangeText={(v) => setField("farmerName", v)} />
      <Input label="Mobile Number *" value={form.mobileNumber} onChangeText={(v) => setField("mobileNumber", v)} keyboardType="phone-pad" />
      <Input label="Alternate Mobile" value={form.alternateMobileNumber} onChangeText={(v) => setField("alternateMobileNumber", v)} keyboardType="phone-pad" />
      <Input label="Gender (Male/Female/Other)" value={form.gender} onChangeText={(v) => setField("gender", v)} />
      <Input label="Date of Birth (YYYY-MM-DD)" value={form.dateOfBirth} onChangeText={(v) => setField("dateOfBirth", v)} />

      <Text style={styles.section}>Address</Text>
      <Input label="Village" value={form.address.village} onChangeText={(v) => setAddr("village", v)} />
      <Input label="Taluk" value={form.address.taluk} onChangeText={(v) => setAddr("taluk", v)} />
      <Input label="District" value={form.address.district} onChangeText={(v) => setAddr("district", v)} />
      <Input label="State" value={form.address.state} onChangeText={(v) => setAddr("state", v)} />
      <Input label="PIN Code" value={form.address.pinCode} onChangeText={(v) => setAddr("pinCode", v)} keyboardType="number-pad" />

      <Text style={styles.section}>Additional</Text>
      <Input label="Primary Occupation" value={form.primaryOccupation} onChangeText={(v) => setField("primaryOccupation", v)} />
      <Input label="Farming Experience (Years)" value={String(form.farmingExperienceYears ?? "")} onChangeText={(v) => setField("farmingExperienceYears", v)} keyboardType="number-pad" />

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? "Saving..." : "Save Farmer"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Input({ label, ...props }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f7f3" },
  section: { fontSize: 15, fontWeight: "700", color: "#2f6d3c", marginTop: 12, marginBottom: 6 },
  label: { fontSize: 12, color: "#667", marginBottom: 4 },
  input: { backgroundColor: "#fff", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#ddd" },
  button: { backgroundColor: "#2f6d3c", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 20, marginBottom: 40 },
  buttonText: { color: "#fff", fontWeight: "700" },
});
