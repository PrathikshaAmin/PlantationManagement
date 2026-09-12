import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, FlatList, Alert, Dimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import * as ImagePicker from "expo-image-picker";
import api from "../../api/client";

const API_ROOT = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api").replace("/api", "");

export default function PlantationDetailsScreen({ route, navigation }) {
  const { id } = route.params;
  const [data, setData] = useState(null);
  const [images, setImages] = useState([]);
  const [activities, setActivities] = useState([]);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    api.get(`/plantations/${id}`).then((res) => setData(res.data.data));
    api.get(`/plantations/${id}/images`).then((res) => setImages(res.data.data));
    api.get(`/plantations/${id}/activities`).then((res) => setActivities(res.data.data));
  }, [id]);

  useFocusEffect(load);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Photo library access is required to upload images");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    try {
      const formData = new FormData();
      result.assets.forEach((asset, i) => {
        formData.append("images", {
          uri: asset.uri,
          name: `photo_${i}.jpg`,
          type: "image/jpeg",
        });
      });
      formData.append("category", "Plantation Overview");
      await api.post(`/plantations/${id}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      load();
    } catch (err) {
      Alert.alert("Upload failed", err.response?.data?.message || "Please try again");
    } finally {
      setUploading(false);
    }
  };

  if (!data) return <View style={styles.container}><Text>Loading...</Text></View>;
  const { plantation, statistics, location } = data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.name}>{plantation.plantationName}</Text>
      <Text style={styles.sub}>{plantation.plantationCode} · {plantation.plantationType || "-"}</Text>

      <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate("PlantationForm", { id })}>
        <Text style={styles.editBtnText}>Edit Plantation</Text>
      </TouchableOpacity>

      <Section title="Owner">
        <Row label="Farmer" value={plantation.farmer?.farmerName} />
        <Row label="Mobile" value={plantation.farmer?.mobileNumber} />
      </Section>

      <Section title="Area">
        <Row label="Area" value={`${plantation.area} ${plantation.areaUnit}`} />
        <Row label="Plants" value={plantation.numberOfPlants} />
        <Row label="Soil Type" value={plantation.soilType} />
        <Row label="Irrigation" value={plantation.irrigationMethod} />
      </Section>

      <Section title="Statistics">
        <Row label="Photos" value={statistics.imageCount} />
        <Row label="Activity Entries" value={statistics.activityCount} />
      </Section>

      {location && (
        <Section title="Location">
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} />
          </MapView>
        </Section>
      )}

      <Section title="Photos">
        <TouchableOpacity style={styles.gpsBtn} onPress={handlePickImage} disabled={uploading}>
          <Text style={styles.editBtnText}>{uploading ? "Uploading..." : "+ Add Photos"}</Text>
        </TouchableOpacity>
        <FlatList
          data={images}
          horizontal
          keyExtractor={(img) => img._id}
          scrollEnabled={false}
          numColumns={3}
          ListEmptyComponent={<Text style={styles.empty}>No photos yet</Text>}
          renderItem={({ item }) => (
            <Image source={{ uri: `${API_ROOT}${item.imageUrl}` }} style={styles.thumb} />
          )}
        />
      </Section>

      <Section title="Activity History">
        {activities.length === 0 && <Text style={styles.empty}>No activity recorded yet</Text>}
        {activities.map((a) => (
          <View key={a._id} style={styles.activityRow}>
            <Text style={styles.activityType}>{a.activityType}</Text>
            <Text style={styles.sub}>{a.remarks}</Text>
            <Text style={styles.activityDate}>{new Date(a.activityDate).toLocaleString()}</Text>
          </View>
        ))}
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}
function Row({ label, value }) {
  return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value ?? "-"}</Text></View>;
}

const screenWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f7f3" },
  name: { fontSize: 22, fontWeight: "700", color: "#1f2a1f" },
  sub: { fontSize: 13, color: "#667", marginTop: 2 },
  editBtn: { backgroundColor: "#2f6d3c", borderRadius: 8, padding: 10, alignItems: "center", marginTop: 12 },
  editBtnText: { color: "#fff", fontWeight: "700" },
  gpsBtn: { backgroundColor: "#5a9367", borderRadius: 8, padding: 10, alignItems: "center", marginBottom: 8 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#2f6d3c", marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#eee" },
  rowLabel: { color: "#667" },
  rowValue: { fontWeight: "600" },
  map: { width: "100%", height: 200, borderRadius: 8 },
  thumb: { width: (screenWidth - 32 - 16) / 3, height: (screenWidth - 32 - 16) / 3, margin: 2, borderRadius: 6 },
  empty: { color: "#999", textAlign: "center", paddingVertical: 12 },
  activityRow: { backgroundColor: "#fff", borderRadius: 8, padding: 10, marginBottom: 6 },
  activityType: { fontWeight: "700" },
  activityDate: { fontSize: 11, color: "#999", marginTop: 2 },
});
