---
title: "SoundManager 스크립트"
date: 2026-04-03 12:00:00 +0900
categories: ["개발 메모", "Unity"]
tags: ["Notion 이전", "Unity"]
excerpt: "프로젝트의 BGM·환경음·UI·효과음을 관리하는 SoundManager 구현 코드를 보관한 기록이다."
description: "프로젝트의 BGM·환경음·UI·효과음을 관리하는 SoundManager 구현 코드를 보관한 기록이다."
published: true
migration_id: "35e36532580e81f4a3b9da7da70c66da"
migration_status: "published"
migration_flags: []
---

{% raw %}
```cs
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

/// <summary>
/// 프로젝트 전체의 사운드를 총괄하는 매니저
/// - BGM
/// - Ambient(환경음)
/// - UI
/// - SFX(상호작용 / 퍼즐 / 점프 / 착지 등)
/// 를 분리해서 관리한다.
///
/// 사용 방식:
/// SoundManager.Instance.PlayBGM(SoundManager.BGMType.Title);
/// SoundManager.Instance.PlayAmbient(SoundManager.AmbientType.Ep1_Village_Loop);
/// SoundManager.Instance.PlayUI(SoundManager.UIType.Click);
/// SoundManager.Instance.PlaySFX(SoundManager.SFXType.Ep3_1_DoorOpen);
/// SoundManager.Instance.PlaySFX3D(SoundManager.SFXType.Ep3_1_DoorOpen, transform.position);
/// </summary>
public class SoundManager : MonoBehaviour
{
    public static SoundManager Instance;

    #region Enum

    public enum BGMType
    {
        None,
        Title,
        Episode0,
        Episode1_Village,
        Episode1_1,
        Episode1_2,
        Episode2_Studio,
        Episode2_1,
        Episode2_2,
        Episode3_Lobby,
        Episode3_1,
        Episode3_2,
        Episode4,
        Episode4_Finale
    }

    public enum AmbientType
    {
        None,
        Ep0_Loop,
        Ep1_Village_Loop,
        Ep1_1_Loop,
        Ep1_2_Loop,
        Ep2_Studio_Loop,
        Ep2_1_Loop,
        Ep2_2_Loop,
        Ep3_Lobby_Loop,
        Ep3_1_Loop,
        Ep3_2_Loop,
        Ep4_Loop
    }

    public enum UIType
    {
        None,
        Click,
        Hover,
        Confirm,
        Cancel,
        Open,
        Close
    }

    public enum SFXType
    {
        None,

        // 플레이어 액션
        Jump,
        Land,

        // 에피소드 공용
        PortalPass,

        // 에피소드 1 전용
        Ep1_1_Slide,
        Ep1_Village_RockOpen,
        Ep1_Village_StarPickup,
        Ep1_2_StarMatch,

        // 에피소드 2 전용
        Ep2_Studio_EnterPicture,
        Ep2_1_PaintCorrect,
        Ep2_1_PaintWrong,
        Ep2_1_PaintFall,
        Ep2_2_ObjectGaze,
        Ep2_2_ObjectAppear,

        // 에피소드 3 전용
        Ep3_1_DoorAppear,
        Ep3_1_DoorOpen,
        Ep3_1_DoorPass,
        Ep3_2_TileActive,
        Ep3_2_TileStepCorrect,

        // 에피소드 4 전용
        Ep4_Finale_LeverPull,
        Ep4_Finale_PuzzleComplete,

        // 컷신 연출음
        CutsceneStart,
        CutsceneEnd
    }

    #endregion

    #region Serializable Entry Classes

    [System.Serializable]
    public class BGMEntry
    {
        public BGMType type;
        public AudioClip clip;
    }

    [System.Serializable]
    public class AmbientEntry
    {
        public AmbientType type;
        public AudioClip clip;
    }

    [System.Serializable]
    public class UIEntry
    {
        public UIType type;
        public AudioClip[] clips;
    }

    [System.Serializable]
    public class SFXEntry
    {
        public SFXType type;
        public AudioClip[] clips;
    }

    #endregion

    #region Inspector Fields

    [Header("오디오 소스")]
    [SerializeField] private AudioSource bgmSource;      // 배경음악 전용
    [SerializeField] private AudioSource ambientSource;  // 환경음 전용
    [SerializeField] private AudioSource uiSource;       // UI 사운드 전용
    [SerializeField] private AudioSource sfxSource;      // 일반 효과음 전용

    [Header("볼륨")]
    [Range(0f, 1f)] [SerializeField] private float masterVolume = 1f;
    [Range(0f, 1f)] [SerializeField] private float bgmVolume = 1f;
    [Range(0f, 1f)] [SerializeField] private float ambientVolume = 1f;
    [Range(0f, 1f)] [SerializeField] private float uiVolume = 1f;
    [Range(0f, 1f)] [SerializeField] private float sfxVolume = 1f;

    [Header("랜덤 피치")]
    [SerializeField] private bool useRandomPitchForSFX = true;
    [SerializeField] private float sfxPitchMin = 0.95f;
    [SerializeField] private float sfxPitchMax = 1.05f;

    [Header("BGM 목록")]
    [SerializeField] private List<BGMEntry> bgmEntries = new List<BGMEntry>();

    [Header("Ambient 목록")]
    [SerializeField] private List<AmbientEntry> ambientEntries = new List<AmbientEntry>();

    [Header("UI 목록")]
    [SerializeField] private List<UIEntry> uiEntries = new List<UIEntry>();

    [Header("SFX 목록")]
    [SerializeField] private List<SFXEntry> sfxEntries = new List<SFXEntry>();

    [Header("씬 로드 시 자동 BGM 설정 여부")]
    [SerializeField] private bool useAutoSceneBGM = true;

    [Header("씬 로드 시 자동 Ambient 설정 여부")]
    [SerializeField] private bool useAutoSceneAmbient = true;

    #endregion

    #region Runtime Dictionaries

    private Dictionary<BGMType, AudioClip> bgmDict = new Dictionary<BGMType, AudioClip>();
    private Dictionary<AmbientType, AudioClip> ambientDict = new Dictionary<AmbientType, AudioClip>();
    private Dictionary<UIType, AudioClip[]> uiDict = new Dictionary<UIType, AudioClip[]>();
    private Dictionary<SFXType, AudioClip[]> sfxDict = new Dictionary<SFXType, AudioClip[]>();

    #endregion

    #region Unity Life Cycle

    private void Awake()
    {
        // 싱글톤 중복 생성 방지
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject);

        BuildDictionaries();
        ApplyVolumes();

        SceneManager.sceneLoaded += OnSceneLoaded;
    }

    private void OnDestroy()
    {
        if (Instance == this)
        {
            SceneManager.sceneLoaded -= OnSceneLoaded;
        }
    }

    #endregion

    #region Initialize

    /// <summary>
    /// Inspector에서 등록한 리스트를 Dictionary로 변환
    /// 런타임 재생 속도와 관리 편의를 위해 사용
    /// </summary>
    private void BuildDictionaries()
    {
        bgmDict.Clear();
        foreach (var entry in bgmEntries)
        {
            if (entry == null) continue;
            if (entry.clip == null) continue;
            if (bgmDict.ContainsKey(entry.type)) continue;

            bgmDict.Add(entry.type, entry.clip);
        }

        ambientDict.Clear();
        foreach (var entry in ambientEntries)
        {
            if (entry == null) continue;
            if (entry.clip == null) continue;
            if (ambientDict.ContainsKey(entry.type)) continue;

            ambientDict.Add(entry.type, entry.clip);
        }

        uiDict.Clear();
        foreach (var entry in uiEntries)
        {
            if (entry == null) continue;
            if (entry.clips == null || entry.clips.Length == 0) continue;
            if (uiDict.ContainsKey(entry.type)) continue;

            uiDict.Add(entry.type, entry.clips);
        }

        sfxDict.Clear();
        foreach (var entry in sfxEntries)
        {
            if (entry == null) continue;
            if (entry.clips == null || entry.clips.Length == 0) continue;
            if (sfxDict.ContainsKey(entry.type)) continue;

            sfxDict.Add(entry.type, entry.clips);
        }
    }

    /// <summary>
    /// 각 소스에 볼륨 적용
    /// Master Volume도 함께 곱해서 최종 볼륨을 만든다.
    /// </summary>
    private void ApplyVolumes()
    {
        if (bgmSource != null) bgmSource.volume = masterVolume * bgmVolume;
        if (ambientSource != null) ambientSource.volume = masterVolume * ambientVolume;
        if (uiSource != null) uiSource.volume = masterVolume * uiVolume;
        if (sfxSource != null) sfxSource.volume = masterVolume * sfxVolume;
    }

    #endregion

    #region Scene Loaded

    /// <summary>
    /// 씬이 로드될 때 자동으로 BGM / Ambient를 설정한다.
    /// </summary>
    private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
    {
        if (useAutoSceneBGM)
        {
            switch (scene.name)
            {
                case "Title":
                    PlayBGM(BGMType.Title);
                    break;

                case "Episode0":
                    PlayBGM(BGMType.Episode0);
                    break;

                case "Episode1_Village":
                    PlayBGM(BGMType.Episode1_Village);
                    break;

                case "Episode1_1":
                    PlayBGM(BGMType.Episode1_1);
                    break;

                case "Episode1_2":
                    PlayBGM(BGMType.Episode1_2);
                    break;

                case "Episode2_Studio":
                    PlayBGM(BGMType.Episode2_Studio);
                    break;

                case "Episode2_1":
                    PlayBGM(BGMType.Episode2_1);
                    break;

                case "Episode2_2":
                    PlayBGM(BGMType.Episode2_2);
                    break;

                case "Episode3_Lobby":
                    PlayBGM(BGMType.Episode3_Lobby);
                    break;

                case "Episode3_1":
                    PlayBGM(BGMType.Episode3_1);
                    break;

                case "Episode3_2":
                    PlayBGM(BGMType.Episode3_2);
                    break;

                case "Episode4":
                    PlayBGM(BGMType.Episode4);
                    break;

                case "Episode4_Finale":
                    PlayBGM(BGMType.Episode4_Finale);
                    break;
            }
        }

        if (useAutoSceneAmbient)
        {
            switch (scene.name)
            {
                case "Title":
                    StopAmbient();
                    break;

                case "Episode0":
                    PlayAmbient(AmbientType.Ep0_Loop);
                    break;

                case "Episode1_Village":
                    PlayAmbient(AmbientType.Ep1_Village_Loop);
                    break;

                case "Episode1_1":
                    PlayAmbient(AmbientType.Ep1_1_Loop);
                    break;

                case "Episode1_2":
                    PlayAmbient(AmbientType.Ep1_2_Loop);
                    break;

                case "Episode2_Studio":
                    PlayAmbient(AmbientType.Ep2_Studio_Loop);
                    break;

                case "Episode2_1":
                    PlayAmbient(AmbientType.Ep2_1_Loop);
                    break;

                case "Episode2_2":
                    PlayAmbient(AmbientType.Ep2_2_Loop);
                    break;

                case "Episode3_Lobby":
                    PlayAmbient(AmbientType.Ep3_Lobby_Loop);
                    break;

                case "Episode3_1":
                    PlayAmbient(AmbientType.Ep3_1_Loop);
                    break;

                case "Episode3_2":
                    PlayAmbient(AmbientType.Ep3_2_Loop);
                    break;

                case "Episode4":
                    PlayAmbient(AmbientType.Ep4_Loop);
                    break;

                case "Episode4_Finale":
                    // 피날레 크레딧 씬은 음악만 강조하기 위해 Ambient를 사용하지 않음
                    StopAmbient();
                    break;

                default:
                    StopAmbient();
                    break;
            }
        }
    }

    #endregion

    #region BGM

    /// <summary>
    /// BGM 재생
    /// 이미 같은 곡이 재생 중이면 다시 재생하지 않는다.
    /// </summary>
    public void PlayBGM(BGMType type, bool loop = true)
    {
        if (type == BGMType.None) return;
        if (bgmSource == null) return;

        if (!bgmDict.TryGetValue(type, out AudioClip clip))
        {
            Debug.LogWarning($"[SoundManager] BGM 클립이 등록되지 않음: {type}");
            return;
        }

        if (bgmSource.clip == clip && bgmSource.isPlaying)
            return;

        bgmSource.clip = clip;
        bgmSource.loop = loop;
        bgmSource.Play();
    }

    public void StopBGM()
    {
        if (bgmSource == null) return;
        bgmSource.Stop();
        bgmSource.clip = null;
    }

    #endregion

    #region Ambient

    /// <summary>
    /// 환경음 루프 재생
    /// </summary>
    public void PlayAmbient(AmbientType type, bool loop = true)
    {
        if (type == AmbientType.None) return;
        if (ambientSource == null) return;

        if (!ambientDict.TryGetValue(type, out AudioClip clip))
        {
            Debug.LogWarning($"[SoundManager] Ambient 클립이 등록되지 않음: {type}");
            return;
        }

        if (ambientSource.clip == clip && ambientSource.isPlaying)
            return;

        ambientSource.clip = clip;
        ambientSource.loop = loop;
        ambientSource.Play();
    }

    public void StopAmbient()
    {
        if (ambientSource == null) return;
        ambientSource.Stop();
        ambientSource.clip = null;
    }

    #endregion

    #region UI

    /// <summary>
    /// UI 사운드 재생
    /// - 여러 클립이 있으면 랜덤으로 선택
    /// - PlayOneShot으로 다른 UI 효과와 자연스럽게 겹칠 수 있음
    /// </summary>
    public void PlayUI(UIType type)
    {
        if (type == UIType.None) return;
        if (uiSource == null) return;

        if (!uiDict.TryGetValue(type, out AudioClip[] clips))
        {
            Debug.LogWarning($"[SoundManager] UI 클립이 등록되지 않음: {type}");
            return;
        }

        AudioClip clip = GetRandomClip(clips);
        if (clip == null) return;

        uiSource.PlayOneShot(clip, masterVolume * uiVolume);
    }

    #endregion

    #region SFX

    /// <summary>
    /// 일반 2D 효과음 재생
    /// - 상호작용
    /// - 퍼즐
    /// - 플레이어 점프 / 착지
    /// 같은 전역/평면적인 효과음에 사용
    /// </summary>
    public void PlaySFX(SFXType type)
    {
        if (type == SFXType.None) return;
        if (sfxSource == null) return;

        if (!sfxDict.TryGetValue(type, out AudioClip[] clips))
        {
            Debug.LogWarning($"[SoundManager] SFX 클립이 등록되지 않음: {type}");
            return;
        }

        AudioClip clip = GetRandomClip(clips);
        if (clip == null) return;

        float oldPitch = sfxSource.pitch;

        if (useRandomPitchForSFX)
            sfxSource.pitch = Random.Range(sfxPitchMin, sfxPitchMax);

        sfxSource.PlayOneShot(clip, masterVolume * sfxVolume);

        // PlayOneShot 후 pitch를 원래값으로 복구
        sfxSource.pitch = oldPitch;
    }

    /// <summary>
    /// 3D 위치 기반 효과음 재생
    /// - 문 여는 소리
    /// - 포탈 통과 소리
    /// - 오브젝트 상호작용 소리
    /// 등에 사용
    /// </summary>
    public void PlaySFX3D(SFXType type, Vector3 position, float volumeScale = 1f)
    {
        if (type == SFXType.None) return;

        if (!sfxDict.TryGetValue(type, out AudioClip[] clips))
        {
            Debug.LogWarning($"[SoundManager] 3D SFX 클립이 등록되지 않음: {type}");
            return;
        }

        AudioClip clip = GetRandomClip(clips);
        if (clip == null) return;

        GameObject tempObj = new GameObject($"Temp3DSFX_{type}");
        tempObj.transform.position = position;

        AudioSource tempSource = tempObj.AddComponent<AudioSource>();
        tempSource.clip = clip;
        tempSource.volume = masterVolume * sfxVolume * volumeScale;
        tempSource.spatialBlend = 1f;
        tempSource.rolloffMode = AudioRolloffMode.Linear;
        tempSource.minDistance = 1f;
        tempSource.maxDistance = 15f;

        if (useRandomPitchForSFX)
            tempSource.pitch = Random.Range(sfxPitchMin, sfxPitchMax);

        tempSource.Play();

        Destroy(tempObj, clip.length + 0.1f);
    }

    #endregion

    #region Utility

    /// <summary>
    /// 배열 안에서 랜덤 클립 하나를 고른다.
    /// </summary>
    private AudioClip GetRandomClip(AudioClip[] clips)
    {
        if (clips == null || clips.Length == 0)
            return null;

        int index = Random.Range(0, clips.Length);
        return clips[index];
    }

    #endregion

    #region Volume Control

    public void SetMasterVolume(float value)
    {
        masterVolume = Mathf.Clamp01(value);
        ApplyVolumes();
    }

    public void SetBGMVolume(float value)
    {
        bgmVolume = Mathf.Clamp01(value);
        ApplyVolumes();
    }

    public void SetAmbientVolume(float value)
    {
        ambientVolume = Mathf.Clamp01(value);
        ApplyVolumes();
    }

    public void SetUIVolume(float value)
    {
        uiVolume = Mathf.Clamp01(value);
        ApplyVolumes();
    }

    public void SetSFXVolume(float value)
    {
        sfxVolume = Mathf.Clamp01(value);
        ApplyVolumes();
    }

    #endregion
}
```
{% endraw %}
